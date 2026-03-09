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
  
    if (this.user && this.user.id) {
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

            const filtrado = this.historialTicketsCreados.filter(t => {
                if (!t.fecha) return false;
                const d = new Date(t.fecha.includes('T') ? t.fecha : t.fecha.replace(' ', 'T'));
                return d.getMonth() === mesActual && d.getFullYear() === añoActual;
            });

            this.cantidadTicketsMesActual = filtrado.length;
            this.calcularDistribucionAnual();
            this.indicadorGraficasCargadas = true;
            this.detectorCambios.detectChanges();

            setTimeout(() => {
                this.dibujarGraficaDona();
                this.dibujarGraficaLineas(this.etiquetasEvolucionAnual, this.valoresEvolucionAnual);
                this.dibujarGraficaBarras();
            }, 50);
        }
    });
}


  dibujarGraficaLineas(etiquetasGrafica: string[], datosGrafica: number[]) {
      const elementoLienzo = document.getElementById('secMonthlyChart') as HTMLCanvasElement;
      if (elementoLienzo) {
          const instanciaPrevia = Chart.getChart(elementoLienzo);
          if (instanciaPrevia) instanciaPrevia.destroy();
          new Chart(elementoLienzo, {
              type: 'line', 
              data: {
                  labels: etiquetasGrafica,
                  datasets: [{
                      label: 'Tickets Creados',
                      data: datosGrafica,
                      borderColor: '#56212f', 
                      backgroundColor: 'rgba(86, 33, 47, 0.1)', 
                      borderWidth: 3, fill: true, tension: 0.4 
                  }]
              },
              options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
      }
  }

  dibujarGraficaDona() {
      const elementoLienzo = document.getElementById('secCreatedTotalChart') as HTMLCanvasElement;
      if (!elementoLienzo) return;
      const instanciaPrevia = Chart.getChart(elementoLienzo);
      if (instanciaPrevia) instanciaPrevia.destroy();
      const existenRegistros = this.cantidadTicketsMesActual > 0;
      new Chart(elementoLienzo, {
          type: 'doughnut',
          data: {
              labels: ['Mis Tickets'],
              datasets: [{
                  data: existenRegistros ? [this.cantidadTicketsMesActual] : [1],
                  backgroundColor: existenRegistros ? ['#3b82f6'] : ['#e2e8f0'],
                  borderWidth: 0
              }]
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: existenRegistros } } }
      });
  }

  dibujarGraficaBarras() {
      const elementoLienzo = document.getElementById('secCreatedHistoryChart') as HTMLCanvasElement;
      if (!elementoLienzo) return;
      const instanciaPrevia = Chart.getChart(elementoLienzo);
      if (instanciaPrevia) instanciaPrevia.destroy();

      const agrupacionPorPersonal: { [identificadorPersona: string]: number } = {};
      const añoActual = new Date().getFullYear();

      this.historialTicketsCreados.forEach(ticket => {
          if (!ticket.fecha) return;
          const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
          if (!isNaN(objetoFechaTicket.getTime()) && objetoFechaTicket.getFullYear() === añoActual) {
              let identificadorTecnico = ticket.personal || ticket.asignado_a || ticket.nombre_asignado || 'Sin Asignar';
              if (!isNaN(Number(identificadorTecnico)) && identificadorTecnico !== 'Sin Asignar') {
                  identificadorTecnico = `Usuario ID: ${identificadorTecnico}`; 
              }
              agrupacionPorPersonal[identificadorTecnico] = (agrupacionPorPersonal[identificadorTecnico] || 0) + 1;
          }
      });

      let arregloOrdenadoAsignaciones = Object.entries(agrupacionPorPersonal);
      arregloOrdenadoAsignaciones.sort((elementoA, elementoB) => elementoB[1] - elementoA[1]);

      const etiquetasNombres = arregloOrdenadoAsignaciones.map(item => item[0]);
      const datosCantidades = arregloOrdenadoAsignaciones.map(item => item[1]);
      const paletaColores = etiquetasNombres.map((_, indice) => this.seleccionarColorHex(indice));

      new Chart(elementoLienzo, {
          type: 'bar',
          data: { labels: etiquetasNombres, datasets: [{ label: 'Tickets', data: datosCantidades, backgroundColor: paletaColores, borderRadius: 4 }] },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
  }

  calcularDistribucionAnual() {
      const añoActual = new Date().getFullYear();
      this.etiquetasEvolucionAnual = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      this.valoresEvolucionAnual = new Array(12).fill(0); 

      this.historialTicketsCreados.forEach(ticket => {
          if (!ticket.fecha) return;
          const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
          if (!isNaN(objetoFechaTicket.getTime()) && objetoFechaTicket.getFullYear() === añoActual) {
              const indiceDelMes = objetoFechaTicket.getMonth(); 
              this.valoresEvolucionAnual[indiceDelMes]++;
          }
      });
  }

  seleccionarColorHex(indiceArreglo: number): string {
      const coloresPredefinidos = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
      return coloresPredefinidos[indiceArreglo % coloresPredefinidos.length];
  }
}