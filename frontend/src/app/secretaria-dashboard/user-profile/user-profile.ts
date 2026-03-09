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
  //private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 
 private apiUrl = 'http://10.15.10.46/soporteSEIEM/MesadetrabajoSEIEM/backend/update_profile.php'; 

  datosUsuario: any = { nombre: '', email: '' }; 
  nuevaContrasena = '';
  confirmarContrasena = ''; 
  nombreMesActual = ''; 
  fechaHoy = '';
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
    const dia = fechaSistema.getDate();
    this.fechaHoy= `${dia} de ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} de ${añoSistema}`;

  }


obtenerRendimientoHistorico(idUsuario: number) {
      this.apiService.getDatosDeSecretaria(idUsuario).subscribe({
          next: (respuestaServidor: any[]) => {
              this.historialTicketsCreados = respuestaServidor || [];
              
              const fechaReferencia = new Date();
              const mesFiltro = fechaReferencia.getMonth(); 
              const añoFiltro = fechaReferencia.getFullYear();
              
              const añoLocal = fechaReferencia.getFullYear();
              const mesLocal = String(fechaReferencia.getMonth() + 1).padStart(2, '0');
              const diaLocal = String(fechaReferencia.getDate()).padStart(2, '0');
              const hoyFiltro = `${añoLocal}-${mesLocal}-${diaLocal}`;
              
              let creadosHoy = 0;
              let completosHoy = 0;
              let enEsperaHoy = 0;
              let dictaminadosHoy = 0; 
              const conteoTecnicosHoy: { [nombre: string]: number } = {};

              const filtradoMesActual = this.historialTicketsCreados.filter(ticket => {
                  if (!ticket.fecha) return false;
                  
                  if(ticket.fecha.startsWith(hoyFiltro)) {
                      creadosHoy++;
                      
                      if(ticket.estado === 'Completo' || ticket.estado === 'Completado') completosHoy++;
                      else if(ticket.estado === 'En espera') enEsperaHoy++;

                      let nombreTecnico = ticket.personal || 'Sin Asignar';
                      conteoTecnicosHoy[nombreTecnico] = (conteoTecnicosHoy[nombreTecnico] || 0) + 1;
                  }

                  const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
                  return objetoFechaTicket.getMonth() === mesFiltro && 
                         objetoFechaTicket.getFullYear() === añoFiltro;
              });

              let maximoTecnico = 'Nadie aún';
              let maximosTickets = 0;
              for (const [tecnico, cantidad] of Object.entries(conteoTecnicosHoy)) {
                  if (cantidad > maximosTickets && tecnico !== 'Sin Asignar') {
                      maximosTickets = cantidad;
                      maximoTecnico = tecnico;
                  }
              }

              this.datosUsuario.hoyTotal = creadosHoy;
              this.datosUsuario.hoyCompletos = completosHoy;
              this.datosUsuario.hoyEspera = enEsperaHoy;
              this.datosUsuario.hoyTecnicoFav = maximoTecnico;
            
              this.datosUsuario.hoyPorcentaje = creadosHoy > 0 ? Math.round((completosHoy / creadosHoy) * 100) : 0;

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
                      label: 'Creados (#)',
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
    
    const conteoCategorias: { [categoria: string]: number } = {};
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();

    const mapaColores: { [key: string]: string } = {
        'Internet': '#2563eb',
        'Office': '#d97706',
        'Telefonia': '#1e293b',
        'Tecnico': '#059669',
        'Dictaminar': '#6d28d9',
        'Correo': '#96241c',
        'Sin Categoría': '#e2e8f0'
    };

    this.historialTicketsCreados.forEach(ticket => {
        if (!ticket.fecha) return;
        const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
        
        if (!isNaN(objetoFechaTicket.getTime()) && 
            objetoFechaTicket.getMonth() === mesActual && 
            objetoFechaTicket.getFullYear() === añoActual) {
            
            const categoria = ticket.descripcion || 'Sin Categoría';
            conteoCategorias[categoria] = (conteoCategorias[categoria] || 0) + 1;
        }
    });

    const etiquetasCategorias = Object.keys(conteoCategorias);
    const datosCategorias = Object.values(conteoCategorias);

    const coloresParaLaGrafica = etiquetasCategorias.map(nombre => {
        return mapaColores[nombre] || '#6366f1'; 
    });
    
    const existenRegistros = etiquetasCategorias.length > 0;

    new Chart(elementoLienzo, {
        type: 'doughnut',
        data: {
            labels: existenRegistros ? etiquetasCategorias : ['Sin datos este mes'],
            datasets: [{
                data: existenRegistros ? datosCategorias : [1],
                backgroundColor: existenRegistros ? coloresParaLaGrafica : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 5
            }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          cutout: '65%',
          layout: { padding: 10 },
          plugins: { 
              legend: { 
                  display: existenRegistros,
                  position: 'right',
                  labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: { size: 11, family: "'Inter', sans-serif" }
                  }
              }, 
              tooltip: { 
                  enabled: existenRegistros,
                  callbacks: {
                      label: (context) => ` ${context.label}: ${context.raw} tickets`
                  }
              } 
          } 
        }
    });
}

  dibujarGraficaBarras() {
      const elementoLienzo = document.getElementById('createdHistoryChart') as HTMLCanvasElement;
      if (!elementoLienzo) return;

      const instanciaPrevia = Chart.getChart(elementoLienzo);
      if (instanciaPrevia) instanciaPrevia.destroy();

      const agrupacionPorPersonal: { [identificadorPersona: string]: number } = {};
      
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth();
      const añoActual = fechaActual.getFullYear();

      this.historialTicketsCreados.forEach(ticket => {
          if (!ticket.fecha) return;
          const objetoFechaTicket = new Date(ticket.fecha.replace(' ', 'T'));
          
          if (!isNaN(objetoFechaTicket.getTime()) && 
              objetoFechaTicket.getMonth() === mesActual && 
              objetoFechaTicket.getFullYear() === añoActual) {
              
              let identificadorTecnico = ticket.personal || 'Sin Asignar';
              agrupacionPorPersonal[identificadorTecnico] = (agrupacionPorPersonal[identificadorTecnico] || 0) + 1;
          }
      });

      let arregloOrdenadoAsignaciones = Object.entries(agrupacionPorPersonal);
      arregloOrdenadoAsignaciones.sort((elementoA, elementoB) => elementoB[1] - elementoA[1]);

      const etiquetasNombres = arregloOrdenadoAsignaciones.map(item => item[0]);
      const datosCantidades = arregloOrdenadoAsignaciones.map(item => item[1]);
      
      const colorBarraPrincipal = '#56212f';
      const existenRegistros = etiquetasNombres.length > 0;

      new Chart(elementoLienzo, {
          type: 'bar',
          data: {
              labels: existenRegistros ? etiquetasNombres : ['Sin asignaciones este mes'], 
              datasets: [{
                  label: 'Tickets Asignados',
                  data: existenRegistros ? datosCantidades : [0],   
                  backgroundColor: existenRegistros ? colorBarraPrincipal : '#e2e8f0',
                  borderRadius: 6,
                  barPercentage: 0.5, 
              }]
          },
          options: {
              indexAxis: 'y', 
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false }, 
                  tooltip: {
                      enabled: existenRegistros,
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      padding: 10,
                      callbacks: { label: (contexto) => ` Asignaste: ${contexto.raw} tickets` }
                  }
              },
              scales: {
                  x: {
                      beginAtZero: true,
                      ticks: { stepSize: 1, font: { size: 10 } }, 
                      grid: { color: '#f1f5f9' },
                      max: existenRegistros ? undefined : 1
                  },
                  y: {
                      grid: { display: false },
                      ticks: { 
                          font: { weight: 'bold', size: 11 },
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