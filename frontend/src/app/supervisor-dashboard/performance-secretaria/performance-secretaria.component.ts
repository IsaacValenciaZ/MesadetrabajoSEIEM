import { Component, OnInit, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-performance-secretaria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './performance-secretaria.component.html',
  styleUrls: ['./performance-secretaria.component.css']
})
export class PerformanceSecretariaComponent implements OnInit {
  @Input() user: any; 
  @Output() close = new EventEmitter<void>();

  private apiService = inject(ApiService);
  private detectorCambios = inject(ChangeDetectorRef);

  nombreMesActual = ''; 
  cantidadTicketsMesActual = 0;
  historialTicketsCreados: any[] = [];
  indicadorGraficasCargadas = false; 
  etiquetasEvolucionAnual: string[] = [];
  valoresEvolucionAnual: number[] = [];

  ngOnInit() {
    this.construirNombreMesActual(); 
    this.cantidadTicketsMesActual = 0;
    this.historialTicketsCreados = [];
    
    if (this.user && this.user.id) {
        console.log("Consultando rendimiento individual para ID:", this.user.id);
        this.obtenerRendimientoHistorico(this.user.id);
    }
  }

  cerrarModal() {
    this.close.emit();
  }

  construirNombreMesActual() {
    const fechaSistema = new Date();
    const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaSistema);
    const añoSistema = fechaSistema.getFullYear();
    this.nombreMesActual = `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}/${añoSistema}`;
  }

  obtenerRendimientoHistorico(idUsuario: number) {
      this.apiService.getTicketsCreadosPorSecretaria(idUsuario).subscribe({
          next: (respuestaServidor: any[]) => {
              this.historialTicketsCreados = respuestaServidor || [];
              
              const hoy = new Date();
              const mesActual = hoy.getMonth(); 
              const añoActual = hoy.getFullYear();
              
              const filtradoMesActual = this.historialTicketsCreados.filter(ticket => {
                  if (!ticket.fecha) return false;
                  const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
                  return objetoFechaTicket.getMonth() === mesActual && 
                         objetoFechaTicket.getFullYear() === añoActual;
              });

              this.cantidadTicketsMesActual = filtradoMesActual.length;
              this.calcularDistribucionAnual();
              this.indicadorGraficasCargadas = true; 
              this.detectorCambios.detectChanges(); 

              setTimeout(() => {
                  this.dibujarGraficas();
              }, 150);
          },
          error: (err) => console.error("Error cargando stats individuales:", err)
      });
  }

  dibujarGraficas() {
      this.dibujarGraficaLineas();
      this.dibujarGraficaDona();
      this.dibujarGraficaBarras();
  }

  dibujarGraficaLineas() {
      const lienzo = document.getElementById('secMonthlyChart') as HTMLCanvasElement;
      if (!lienzo) return;
      const exist = Chart.getChart(lienzo); if (exist) exist.destroy();

      new Chart(lienzo, {
          type: 'line', 
          data: {
              labels: this.etiquetasEvolucionAnual,
              datasets: [{
                  label: 'Tickets Individuales',
                  data: this.valoresEvolucionAnual,
                  borderColor: '#56212f', 
                  backgroundColor: 'rgba(86, 33, 47, 0.1)', 
                  borderWidth: 3, fill: true, tension: 0.4 
              }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
  }

  dibujarGraficaDona() {
      const lienzo = document.getElementById('secCreatedTotalChart') as HTMLCanvasElement;
      if (!lienzo) return;
      const exist = Chart.getChart(lienzo); if (exist) exist.destroy();

      new Chart(lienzo, {
          type: 'doughnut',
          data: {
              labels: ['Tickets de ' + this.user.nombre],
              datasets: [{
                  data: this.cantidadTicketsMesActual > 0 ? [this.cantidadTicketsMesActual] : [1],
                  backgroundColor: this.cantidadTicketsMesActual > 0 ? ['#3b82f6'] : ['#e2e8f0'],
                  borderWidth: 0
              }]
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }
      });
  }

  dibujarGraficaBarras() {
      const lienzo = document.getElementById('secCreatedHistoryChart') as HTMLCanvasElement;
      if (!lienzo) return;
      const exist = Chart.getChart(lienzo); if (exist) exist.destroy();

      const agrupacion: { [key: string]: number } = {};
      this.historialTicketsCreados.forEach(t => {
          const tech = t.personal || 'Sin Asignar';
          agrupacion[tech] = (agrupacion[tech] || 0) + 1;
      });

      const dataSorted = Object.entries(agrupacion).sort((a, b) => b[1] - a[1]);

      new Chart(lienzo, {
          type: 'bar',
          data: { 
              labels: dataSorted.map(i => i[0]), 
              datasets: [{ 
                  data: dataSorted.map(i => i[1]), 
                  backgroundColor: dataSorted.map((_, idx) => this.seleccionarColorHex(idx)),
                  borderRadius: 4 
              }] 
          },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
  }

  calcularDistribucionAnual() {
      const añoActual = new Date().getFullYear();
      this.etiquetasEvolucionAnual = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      this.valoresEvolucionAnual = new Array(12).fill(0); 

      this.historialTicketsCreados.forEach(ticket => {
          if (!ticket.fecha) return;
          const fecha = new Date(ticket.fecha.replace(' ', 'T'));
          if (fecha.getFullYear() === añoActual) {
              this.valoresEvolucionAnual[fecha.getMonth()]++;
          }
      });
  }

  seleccionarColorHex(i: number): string {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
      return colors[i % colors.length];
  }
}