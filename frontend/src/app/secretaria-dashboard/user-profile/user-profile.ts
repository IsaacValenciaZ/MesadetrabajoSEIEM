import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api'; 
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfileComponent implements OnInit {

  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private detectorCambios = inject(ChangeDetectorRef);
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 
 // private apiUrl = 'http://10.15.10.46/soporteSEIEM/MesadetrabajoSEIEM/backend/update_profile.php'; 

  datosUsuario: any = { nombre: '', email: '' }; 
  nuevaContrasena = '';
  confirmarContrasena = ''; 
  nombreMesActual = ''; 
  
  cantidadTicketsMesActual = 0;
  historialTicketsCreados: any[] = [];
  
  indicadorGraficasCargadas = false; 

  etiquetasEvolucionAnual: string[] = [];
  valoresEvolucionAnual: number[] = [];

  ngOnInit() {
    this.construirNombreMesActual(); 
    const sesionAlmacenada = localStorage.getItem('usuario_actual');
    
    if (sesionAlmacenada) {
      this.datosUsuario = JSON.parse(sesionAlmacenada);
      if (this.datosUsuario.id) {
          this.obtenerRendimientoHistorico(this.datosUsuario.id);
      }
    }
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
              
              if(this.historialTicketsCreados.length > 0) {
                  console.log("EJEMPLO DE TICKET:", this.historialTicketsCreados[0]);
              }

              const fechaReferencia = new Date();
              const mesFiltro = fechaReferencia.getMonth(); 
              const añoFiltro = fechaReferencia.getFullYear();
              
              const filtradoMesActual = this.historialTicketsCreados.filter(ticket => {
                  if (!ticket.fecha) return false;
                  const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
                  return objetoFechaTicket.getMonth() === mesFiltro && 
                         objetoFechaTicket.getFullYear() === añoFiltro;
              });

              this.cantidadTicketsMesActual = filtradoMesActual.length;
              this.calcularDistribucionAnual();
              this.indicadorGraficasCargadas = true; 
              this.detectorCambios.detectChanges(); 

              setTimeout(() => {
                  this.dibujarGraficaDona(); 
                  this.dibujarGraficaLineas(this.etiquetasEvolucionAnual, this.valoresEvolucionAnual);
                  this.dibujarGraficaBarras();
              }, 100);
          },
          error: (errorPeticion) => console.error("Error cargando stats:", errorPeticion)
      });
  }

  dibujarGraficaLineas(etiquetasGrafica: string[], datosGrafica: number[]) {
      const elementoLienzo = document.getElementById('monthlyChart') as HTMLCanvasElement;
      if (elementoLienzo) {
          const instanciaPrevia = Chart.getChart(elementoLienzo);
          if (instanciaPrevia) instanciaPrevia.destroy();

          new Chart(elementoLienzo, {
              type: 'line', 
              data: {
                  labels: etiquetasGrafica,
                  datasets: [{
                      label: 'Efectividad (%)',
                      data: datosGrafica,
                      borderColor: '#56212f', 
                      backgroundColor: 'rgba(86, 33, 47, 0.1)', 
                      borderWidth: 3,
                      pointBackgroundColor: '#fff',
                      pointBorderColor: '#56212f',
                      fill: true, 
                      tension: 0.4 
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                      x: { grid: { display: false } }
                  },
                  plugins: { legend: { display: false } }
              }
          });
      }
  }

  dibujarGraficaDona() {
      const elementoLienzo = document.getElementById('createdTotalChart') as HTMLCanvasElement;
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
          options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '75%', 
            layout: {
                padding: 0 
            },
            plugins: { legend: { display: false }, tooltip: { enabled: existenRegistros } } 
          }
      });
  }

  dibujarGraficaBarras() {
      const elementoLienzo = document.getElementById('createdHistoryChart') as HTMLCanvasElement;
      if (!elementoLienzo) return;

      const instanciaPrevia = Chart.getChart(elementoLienzo);
      if (instanciaPrevia) instanciaPrevia.destroy();

      const agrupacionPorPersonal: { [identificadorPersona: string]: number } = {};
      const añoActual = new Date().getFullYear();

      if (this.historialTicketsCreados.length > 0) {
          console.log("Campos del ticket:", Object.keys(this.historialTicketsCreados[0]));
      }

      this.historialTicketsCreados.forEach(ticket => {
          if (!ticket.fecha) return;
          const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
          
          if (!isNaN(objetoFechaTicket.getTime()) && objetoFechaTicket.getFullYear() === añoActual) {
              
              let identificadorTecnico = ticket.personal || 
                                  ticket.asignado_a || 
                                  ticket.nombre_asignado || 
                                  'Sin Asignar';

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
          data: {
              labels: etiquetasNombres, 
              datasets: [{
                  label: 'Tickets',
                  data: datosCantidades,   
                  backgroundColor: paletaColores,
                  borderColor: paletaColores,
                  borderWidth: 1,
                  borderRadius: 4,
                  barPercentage: 0.6,
              }]
          },
          options: {
              indexAxis: 'y', 
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false }, 
                  tooltip: {
                      callbacks: { label: (contexto) => `Tickets: ${contexto.raw}` }
                  }
              },
              scales: {
                  x: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }, 
                      grid: { color: '#f1f5f9' }
                  },
                  y: {
                      grid: { display: false },
                      ticks: { 
                          font: { weight: 'bold' },
                          autoSkip: false
                      }
                  }
              }
          }
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

  procesarActualizacionPerfil() { 
     if (!this.datosUsuario.nombre || !this.datosUsuario.email) {
         Swal.fire('Atención', 'Datos incompletos', 'warning'); return;
     }
     const objetoEnvio = { id: this.datosUsuario.id, nombre: this.datosUsuario.nombre, email: this.datosUsuario.email, password: this.nuevaContrasena };
     this.http.post(this.apiUrl, objetoEnvio).subscribe({
         next: (respuestaServidor: any) => {
             if(respuestaServidor.status) {
                 const sesionAlmacenada = localStorage.getItem('usuario_actual');
                 if (sesionAlmacenada) {
                     let parseoUsuario = JSON.parse(sesionAlmacenada);
                     parseoUsuario.nombre = this.datosUsuario.nombre;
                     parseoUsuario.email = this.datosUsuario.email;
                     localStorage.setItem('usuario_actual', JSON.stringify(parseoUsuario));
                 }
                 Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Perfil actualizado', confirmButtonColor: '#56212f' }).then(() => window.location.reload());
             } else { Swal.fire('Error', respuestaServidor.message, 'error'); }
         }
     });
  }
}