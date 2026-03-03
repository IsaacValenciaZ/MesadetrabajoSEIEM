import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ApiService } from '../../services/api'; 
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-personal-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-profile.html',
  styleUrls: ['./personal-profile.css']
})
export class PersonalProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef); 
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/update_profile.php'; 

  usuarioActual: any = { nombre: '', email: '' }; 
  nuevaContrasena = '';
  confirmarContrasena = ''; 
  
  etiquetaMesActual = ''; 
  totalTickets = 0;
  ticketsCompletados = 0;
  ticketsIncompletos = 0;
  porcentajeEficiencia = 0;

  ngOnInit() {
    this.establecerMesActual(); 
    const datosGuardados = localStorage.getItem('usuario_actual');
    
    if (datosGuardados) {
      this.usuarioActual = JSON.parse(datosGuardados);
      this.obtenerRendimiento();
    }
  }
  
  establecerMesActual() {
    const fechaActual = new Date();
    const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaActual);
    const anioActual = fechaActual.getFullYear();
    const mesFormateado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    
    this.etiquetaMesActual = `${mesFormateado}/${anioActual}`;
  }

  obtenerRendimiento() {
    this.apiService.getMisTickets(this.usuarioActual.nombre).subscribe({
      next: (respuestaServidor: any[]) => {
        const historialTickets = respuestaServidor || [];
        const fechaReferencia = new Date();
        const mesFiltro = `${fechaReferencia.getFullYear()}-${String(fechaReferencia.getMonth() + 1).padStart(2, '0')}`;

        const ticketsDelMes = historialTickets.filter(ticket => ticket.fecha && ticket.fecha.startsWith(mesFiltro));

        this.totalTickets = ticketsDelMes.length;
        this.ticketsCompletados = ticketsDelMes.filter(ticket => ticket.estado === 'Completo').length;
        this.ticketsIncompletos = this.totalTickets - this.ticketsCompletados;
        this.porcentajeEficiencia = 0;

        if (this.totalTickets > 0) {
            this.porcentajeEficiencia = Math.round((this.ticketsCompletados / this.totalTickets) * 100);
        }

        this.cdr.detectChanges(); 
        this.generarGraficaGeneral(); 
        this.procesarEvolucionMensual(historialTickets); 
      },
      error: () => {
          console.error('No se pudo obtener la información de rendimiento');
      }
    });
  }

  procesarEvolucionMensual(listaTickets: any[]) {
      const agrupacionMensual: { [claveMes: string]: { total: number, completados: number } } = {};

      listaTickets.forEach(ticket => {
          if (!ticket.fecha) {
              return;
          }

          const periodo = ticket.fecha.substring(0, 7); 

          if (!agrupacionMensual[periodo]) {
              agrupacionMensual[periodo] = { total: 0, completados: 0 };
          }
          
          agrupacionMensual[periodo].total++;

          if (ticket.estado === 'Completo') {
              agrupacionMensual[periodo].completados++;
          }
      });

      const etiquetasMeses: string[] = [];
      const nivelesEficiencia: number[] = [];

      Object.keys(agrupacionMensual).sort().forEach(clave => {
          const fechaBase = new Date(clave + '-02'); 
          const formatoEtiqueta = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(fechaBase);
          
          etiquetasMeses.push(formatoEtiqueta); 

          const cantidadTotal = agrupacionMensual[clave].total;
          const cantidadCompletados = agrupacionMensual[clave].completados;
          const calculoPorcentaje = cantidadTotal > 0 ? Math.round((cantidadCompletados / cantidadTotal) * 100) : 0;
          
          nivelesEficiencia.push(calculoPorcentaje); 
      });

      this.generarGraficaEvolucion(etiquetasMeses, nivelesEficiencia);
  }

  generarGraficaGeneral() {
    const lienzo = document.getElementById('profileChart') as HTMLCanvasElement;
    
    if (lienzo) {
        const graficaExistente = Chart.getChart(lienzo);

        if (graficaExistente) {
            graficaExistente.destroy();
        }

        new Chart(lienzo, {
            type: 'doughnut',
            data: {
                labels: ['Completados', 'Pendientes'],
                datasets: [{
                    data: [this.ticketsCompletados, this.ticketsIncompletos],
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                cutout: '75%',
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
  }

  generarGraficaEvolucion(etiquetas: string[], datosEficiencia: number[]) {
      const lienzoMensual = document.getElementById('monthlyChart') as HTMLCanvasElement;

      if (lienzoMensual) {
          const graficaPrevia = Chart.getChart(lienzoMensual);

          if (graficaPrevia) {
              graficaPrevia.destroy();
          }

          new Chart(lienzoMensual, {
              type: 'line', 
              data: {
                  labels: etiquetas,
                  datasets: [{
                      label: 'Efectividad (%)',
                      data: datosEficiencia,
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
                      y: {
                          beginAtZero: true,
                          max: 100,
                          grid: {
                              color: '#f1f5f9'
                          },
                          ticks: {
                              callback: (valor) => valor + '%'
                          }
                      },
                      x: {
                          grid: {
                              display: false
                          }
                      }
                  },
                  plugins: {
                      legend: {
                          display: false
                      }
                  }
              }
          });
      }
  }

  guardarCambiosPerfil() { 
    if (!this.usuarioActual.nombre || !this.usuarioActual.email) {
        Swal.fire('Campos requeridos', 'Asegúrate de llenar tu nombre y correo', 'warning'); 
        return;
    }

    const datosFormulario = { 
        id: this.usuarioActual.id, 
        nombre: this.usuarioActual.nombre, 
        email: this.usuarioActual.email, 
        password: this.nuevaContrasena 
    };

    this.http.post(this.apiUrl, datosFormulario).subscribe({
        next: (respuestaServidor: any) => {
            if (respuestaServidor.status) {
                const sesionActual = localStorage.getItem('usuario_actual');

                if (sesionActual) {
                    let perfilActualizado = JSON.parse(sesionActual);
                    perfilActualizado.nombre = this.usuarioActual.nombre;
                    perfilActualizado.email = this.usuarioActual.email;
                    localStorage.setItem('usuario_actual', JSON.stringify(perfilActualizado));
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Perfil actualizado', 
                    text: 'Tus datos se guardaron exitosamente',
                    confirmButtonColor: '#56212f'
                }).then(() => {
                    window.location.reload(); 
                });
            } else { 
                Swal.fire('No se pudo actualizar', respuestaServidor.message, 'error'); 
            }
        },
        error: () => {
            Swal.fire('Error de conexión', 'No se pudo contactar con el servidor', 'error');
        }
    });
  }
}