import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-performance-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './performance-user.component.html',
  styleUrls: ['./performance-user.component.css']
})
export class PerformanceUserComponent implements OnInit {
  @Input() user: any;
  @Output() close = new EventEmitter<void>();

  private apiService = inject(ApiService);
  private cd = inject(ChangeDetectorRef);

  ticketsTodos: any[] = [];
  mesesDisponibles: string[] = [];
  mesSeleccionado: string = '';
  stats: any = null;
  charts: any[] = [];

  ngOnInit() {
    if (this.user && this.user.nombre) {
      this.cargarDatos();
    }
  }

  cargarDatos() {
    this.apiService.getMisTickets(this.user.nombre).subscribe({
      next: (data) => {
        this.ticketsTodos = data.filter((t: any) =>
          ['Completo', 'Incompleto', 'Completado'].includes(t.estado)
        );
        this.generarMeses();

        if (this.mesesDisponibles.length > 0) {
          this.mesSeleccionado = this.mesesDisponibles[0];
          this.procesarRendimiento();
        }
      }
    });
  }

  generarMeses() {
    const setMeses = new Set<string>();
    this.ticketsTodos.forEach(t => { if (t.fecha) setMeses.add(t.fecha.substring(0, 7)); });
    this.mesesDisponibles = Array.from(setMeses).sort().reverse();
  }

  procesarRendimiento() {
    const filtrados = this.ticketsTodos.filter(t => t.fecha && t.fecha.startsWith(this.mesSeleccionado));

    // USAMOS TU LÓGICA DE CÁLCULO DE PERSONAL-HISTORY
    let completos = 0; let vencidos = 0; let aTiempo = 0; let tarde = 0;
    let sumaMinutos = 0; let conteoConTiempo = 0;
    let rapido = 0; let normal = 0; let lento = 0;

    filtrados.forEach(t => {
      if (t.estado === 'Completo' || t.estado === 'Completado') {
        completos++;
        if (t.fecha_fin && t.fecha_limite) { if (t.fecha_fin <= t.fecha_limite) aTiempo++; else tarde++; }
        if (t.fecha && t.fecha_fin) {
          const diff = new Date(t.fecha_fin).getTime() - new Date(t.fecha).getTime();
          if (diff > 0) {
            const mins = diff / (1000 * 60); sumaMinutos += mins; conteoConTiempo++;
            if (mins < 60) rapido++; else if (mins <= 1440) normal++; else lento++;
            const horas = t.horasDiferencia || 0;
            if (horas < 1) rapido++;
            else if (horas >= 1 && horas <= 24) normal++;
            else if (horas > 24) lento++;
          }
        }
      } else { vencidos++; }
    });

    let tiempoPromedio = "N/A";
    if (conteoConTiempo > 0) {
      const avg = Math.round(sumaMinutos / conteoConTiempo);
      tiempoPromedio = `${Math.floor(avg / 60)}h ${avg % 60}m`;
    }

    this.stats = { total: filtrados.length, completos, vencidos, aTiempo, tarde, tiempoPromedio, rapido, normal, lento };

    this.cd.detectChanges();
    this.renderizarGraficas();
  }

  renderizarGraficas() {

    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const config: any = { responsive: true, plugins: { legend: { position: 'bottom' } } };

    
    const ctx1 = document.getElementById('perfEstatus') as HTMLCanvasElement;
    if (ctx1) this.charts.push(new Chart(ctx1, { type: 'doughnut', data: { labels: ['Ok', 'Vencido'], datasets: [{ data: [this.stats.completos, this.stats.vencidos], backgroundColor: ['#28f328', '#f32828'] }] }, options: config }));
    const ctx2 = document.getElementById('perfPuntualidad') as HTMLCanvasElement;
    if (ctx2) this.charts.push(new Chart(ctx2, { type: 'pie', data: { labels: ['A tiempo', 'Tarde', 'Vencido'], datasets: [{ data: [this.stats.aTiempo, this.stats.tarde, this.stats.vencidos], backgroundColor: ['#28f328', '#f3f028', '#f32828'] }] }, options: config }));
    const ctx3 = document.getElementById('perfTiempos') as HTMLCanvasElement;
    if (ctx3) {this.charts.push(new Chart(ctx3, {type: 'bar', data: {labels: ['<1h', '1-24h', '>24h'],datasets: [{label: 'Reportes',data: [this.stats.rapido, this.stats.normal, this.stats.lento], backgroundColor: ['#28f328', '#f3f028', '#f32828'],borderRadius: 5, barPercentage: 0.8,categoryPercentage: 0.9 }]},
      
      options: {
                responsive: true,
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { precision: 0 },
                        grid: { display: true } 
                    },
                    x: {
                        grid: { display: false }
                    }}
        }
      }));
    }
  }



  obtenerNombreMes(m: string) {
    const f = new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]) - 1, 1);
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(f);
  }

  cerrar() { this.close.emit(); }
}