import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-supervisor-start',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supervisor-start.html',
  styleUrls: ['./supervisor-start.css']
})
export class SupervisorStartComponent implements OnInit, AfterViewInit, OnDestroy {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  
  private pollingSubscription: Subscription | undefined;

  usuarioActual: any = {};
  totalTickets: number = 0;
  ticketsPendientes: number = 0;
  ticketsCompletados: number = 0;
  ticketsAltaPrioridad: number = 0;
  fechaVisual: string = '';

  listaPendientesHoy: any[] = [];
  listaCompletadosHoy: any[] = [];

  chartLinea: any;
  chartDona: any; 
  ticketsParaGrafica: any[] = []; 

  @ViewChild('ticketsChartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donaChartCanvas') donaCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit() {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    };
    this.fechaVisual = new Intl.DateTimeFormat('es-ES', opciones).format(new Date());

    const sesion = localStorage.getItem('usuario_actual');
    if (sesion) {
      this.usuarioActual = JSON.parse(sesion);
    }
    
    this.cargarEstadisticas();

    this.pollingSubscription = interval(15000).subscribe(() => {
        this.cargarEstadisticas(true); 
    });
  }

  ngOnDestroy() {
      if (this.pollingSubscription) {
          this.pollingSubscription.unsubscribe();
      }
  }

  ngAfterViewInit() {
    if (this.ticketsParaGrafica.length > 0) {
      this.generarGraficaLinea(this.ticketsParaGrafica);
      this.generarGraficaDona(this.ticketsParaGrafica);
    }
  }

  cargarEstadisticas(esSilencioso: boolean = false) {
    this.apiService.getSupervisorDataTickets().subscribe({
      next: (tickets) => {
        if (tickets && Array.isArray(tickets)) {
          const hoy = new Date();
          const yyyy = hoy.getFullYear();
          const mm = String(hoy.getMonth() + 1).padStart(2, '0');
          const dd = String(hoy.getDate()).padStart(2, '0');
          const fechaHoyStr = `${yyyy}-${mm}-${dd}`;

          const ticketsDeHoy = tickets.filter(t => t.fecha && t.fecha.startsWith(fechaHoyStr));

          const cantidadAnterior = this.ticketsParaGrafica.length;
          const completadosAnterior = this.ticketsCompletados;
          
          this.ticketsParaGrafica = ticketsDeHoy; 

          this.totalTickets = ticketsDeHoy.length;
          this.listaPendientesHoy = ticketsDeHoy.filter(t => t.estado === 'En espera' || t.estado === 'Incompleto' || !t.estado);
          this.listaCompletadosHoy = ticketsDeHoy.filter(t => t.estado === 'Completo');

          this.ticketsPendientes = this.listaPendientesHoy.length;
          this.ticketsCompletados = this.listaCompletadosHoy.length;
          this.ticketsAltaPrioridad = ticketsDeHoy.filter(t => t.prioridad === 'Alta' && t.estado !== 'Completo').length;

          this.cdr.detectChanges();

          const huboCambios = (cantidadAnterior !== this.totalTickets) || (completadosAnterior !== this.ticketsCompletados);
          
          if (this.chartCanvas && this.donaCanvas && (!esSilencioso || huboCambios)) {
            this.generarGraficaLinea(ticketsDeHoy);
            this.generarGraficaDona(ticketsDeHoy); 
          }
        }
      },
      error: (err) => console.error("Error en ApiService:", err)
    });
  }

  getHora(fecha: string | null | undefined): string {
    if (!fecha) return '--:--';
    const partes = fecha.split(' ');
    return partes.length > 1 ? partes[1] : fecha;
  }

  getProblemaClass(descripcion: string): string {
    if (!descripcion) return 'bg-default';
    const desc = descripcion.toLowerCase();
    if (desc.includes('internet')) return 'bg-internet';
    if (desc.includes('office')) return 'bg-office';
    if (desc.includes('telefonia') || desc.includes('telefono') || desc.includes('extension')) return 'bg-telefonia';
    if (desc.includes('tecnico')) return 'bg-tecnico';
    if (desc.includes('dictaminar')) return 'bg-dictaminar';
    if (desc.includes('correo')) return 'bg-correo';
    return 'bg-default'; 
  }

  generarGraficaLinea(ticketsDeHoy: any[]) {
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) return;
    const horasLabels = ['Antes 10AM', '10AM-12PM', '12PM-2PM', '2PM-4PM', '4PM-6PM', 'Después 6PM'];
    const datosPendientes = [0, 0, 0, 0, 0, 0];
    const datosCompletados = [0, 0, 0, 0, 0, 0];

    ticketsDeHoy.forEach((t: any) => {
      if (t.fecha) {
        const partes = t.fecha.split(' ');
        if (partes.length === 2) {
          const horaStr = partes[1].split(':')[0];
          const hora = parseInt(horaStr, 10);
          let index = 0;
          if (hora < 10) index = 0;
          else if (hora < 12) index = 1;
          else if (hora < 14) index = 2;
          else if (hora < 16) index = 3;
          else if (hora < 18) index = 4;
          else index = 5;

          if (t.estado === 'Completo') datosCompletados[index]++;
          else datosPendientes[index]++;
        }
      }
    });

    if (this.chartLinea) this.chartLinea.destroy();
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartLinea = new Chart(ctx, {
      type: 'line',
      data: {
        labels: horasLabels,
        datasets: [
          {
            label: 'Pendientes',
            data: datosPendientes,
            borderColor: '#f59e0b', 
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4 
          },
          {
            label: 'Completados',
            data: datosCompletados,
            borderColor: '#10b981', 
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        animation: { duration: 500 },
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  generarGraficaDona(ticketsDeHoy: any[]) {
    if (!this.donaCanvas || !this.donaCanvas.nativeElement) return;
    const conteoCategorias: { [categoria: string]: number } = {};
    const mapaColores: { [key: string]: string } = {
        'Internet': '#2563eb', 'Office': '#d97706', 'Telefonia': '#1e293b',
        'Extension/Telefono': '#1e293b', 'Tecnico': '#059669', 'Dictaminar': '#6d28d9',
        'Correo': '#96241c', 'Sin Categoría': '#64748b'
    };

    ticketsDeHoy.forEach(ticket => {
      const categoria = ticket.descripcion || 'Sin Categoría';
      conteoCategorias[categoria] = (conteoCategorias[categoria] || 0) + 1;
    });

    const etiquetasCategorias = Object.keys(conteoCategorias);
    const datosCategorias = Object.values(conteoCategorias);
    const coloresParaLaGrafica = etiquetasCategorias.map(nombre => mapaColores[nombre] || '#64748b');
    
    if (this.chartDona) this.chartDona.destroy();
    const ctx = this.donaCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartDona = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: etiquetasCategorias.length > 0 ? etiquetasCategorias : ['Sin datos'],
            datasets: [{
                data: datosCategorias.length > 0 ? datosCategorias : [1],
                backgroundColor: etiquetasCategorias.length > 0 ? coloresParaLaGrafica : ['#e2e8f0'],
                borderWidth: 2, borderColor: '#ffffff'
            }]
        },
        options: { 
          animation: { duration: 500 },
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } }
        }
    });
  }

  private getProblemaColor(desc: string): string {
    const colors: any = { 
      'Internet': '#2563eb', 'Office': '#d97706', 'Telefonia': '#1e293b', 
      'Extension/Telefono': '#1e293b', 'Tecnico': '#059669', 
      'Dictaminar': '#6d28d9', 'Correo': '#96241c' 
    };
    return colors[desc] || '#64748b';
  }

  private getPrioridadColor(prio: string): string {
    const colors: any = { 'Alta': '#ef4444', 'Media': '#f59e0b', 'Baja': '#10b981' };
    return colors[prio] || '#64748b';
  }

  private getDetallesExtra(ticket: any, color: string): string {
    if (ticket.descripcion === 'Dictaminar' && ticket.cantidad_dicta) 
      return `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.9rem; font-weight: 800; color: ${color};">Equipos: ${ticket.cantidad_dicta}</span>`;
    if (ticket.descripcion === 'Correo' && ticket.correo_tipo) 
      return `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.9rem; font-weight: 800; color: ${color};">Tipo: ${ticket.correo_tipo}</span>`;
    if (ticket.descripcion === 'Tecnico' && ticket.soporte_tipo) 
      return `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.9rem; font-weight: 800; color: ${color};">Soporte: ${ticket.soporte_tipo}</span>`;
    return '';
  }


abrirModalTicket(ticketSeleccionado: any) {
    const colorFondoCategoria = this.getProblemaColor(ticketSeleccionado.descripcion);
    const colorPrioridad = this.getPrioridadColor(ticketSeleccionado.prioridad);
    const detallesExtraHtml = this.getDetallesExtra(ticketSeleccionado, colorFondoCategoria);

    const fechaFormat = ticketSeleccionado.fecha ? new Date(ticketSeleccionado.fecha).toLocaleString('es-MX') : 'N/A';
    const fechaFinFormat = ticketSeleccionado.fecha_fin ? new Date(ticketSeleccionado.fecha_fin).toLocaleString('es-MX') : 'Pendiente';

    let htmlModal = `
      <div style="text-align: left; font-family: 'Segoe UI', sans-serif; color: #1e293b; padding: 10px;">
        <h2 style="margin: 0 0 15px 0; color: #56212f; font-size: 1.8rem; font-weight: 800;">Ticket: #${ticketSeleccionado.id}</h2>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">
          <div>
            <p style="margin: 0; font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Apertura</p>
            <p style="margin: 2px 0 0 0; font-size: 0.9rem; font-weight: 600;">${fechaFormat}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Cierre</p>
            <p style="margin: 2px 0 0 0; font-size: 0.9rem; font-weight: 600; color: #56212f;">${fechaFinFormat}</p>
          </div>
        </div>

        <p style="margin: 0; font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Solicitante</p>
        <p style="margin: 4px 0 15px 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticketSeleccionado.nombre_usuario}</p>

        <div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; border-left: 6px solid ${colorFondoCategoria}; border-radius: 8px; padding: 12px; margin-bottom: 20px; background: #fff;">
          <div>
            <span style="background-color: ${colorFondoCategoria}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">
              ${ticketSeleccionado.descripcion}
            </span>
            ${detallesExtraHtml}
          </div>
          <span style="background-color: ${colorPrioridad}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">
            ${ticketSeleccionado.prioridad}
          </span>
        </div>

        <p style="margin: 0 0 5px 0; font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Notas de solicitud</p>
        <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 12px;">
          <p style="margin: 0; font-size: 0.9rem; color: #475569;">${ticketSeleccionado.notas || 'Sin notas.'}</p>
        </div>
      </div>
    `;

    Swal.fire({
      html: htmlModal,
      width: '600px',
      showConfirmButton: ticketSeleccionado.estado === 'Completo' || ticketSeleccionado.estado === 'Completado',
      confirmButtonText: '<span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 5px;">visibility</span> Ver Evidencias de Resolución',
      confirmButtonColor: '#56212f',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      cancelButtonColor: '#000000',
    }).then((result) => {
      if (result.isConfirmed) {
        this.verEvidenciaFinal(ticketSeleccionado);
      }
    });
}
verEvidenciaFinal(ticket: any) {
    Swal.fire({
      title: 'Procesando datos...',
      text: 'Extrayendo evidencias y firmas de la base de datos, por favor espere.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.apiService.getEvidenciaTicket(ticket.id).subscribe({
      next: (evidencia) => {
        const imagenData = evidencia.evidencia_archivo;
        const firmaData = evidencia.firma_base64;
        const resolucion = evidencia.descripcion_resolucion || 'El técnico no proporcionó una descripción de las tareas realizadas.';

        Swal.fire({
          title: `Resolución del Ticket #${ticket.id}`,
html: `
          <div style="text-align: left; padding: 5px;">
            
            <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">Descripción de la solución:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 5px solid #27ae60; margin-bottom: 15px; max-height: 150px; overflow-y: auto;">
              ${ticket.descripcion_resolucion || 'El técnico no proporcionó una descripción de las tareas realizadas.'}
            </div>

            ${firmaData && firmaData.startsWith('data:image') ? `
            <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">
              Firma de <span style="color: #000000;">${ticket.nombre_usuario}</span>:
            </p>
            <div style="text-align: center; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: #ffffff; margin-bottom: 15px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
              <img src="${firmaData}" style="max-width: 100%; max-height: 120px; object-fit: contain; background: white;">
            </div>
            ` : `
            <div style="padding: 12px; border-radius: 8px; background: #f8fafc; border: 1px dashed #cbd5e1; color: #64748b; font-style: italic; text-align: center; margin-bottom: 15px;">
              Ticket cerrado sin firma del solicitante
            </div>
            `}
                                
            ${imagenData ? `
            <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">Evidencia fotográfica:</p>
            <div style="text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 8px; background: #1a1a1a;">
              <img id="img-evidencia-${ticket.id}" src="${imagenData}" style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 4px; cursor: zoom-in; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
              <small style="display: block; color: #aaa; margin-top: 8px; font-weight: bold;">
                <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">zoom_in</span> 
                Haz clic en la imagen para ampliarla
              </small>
            </div>
            ` : `
            <p style="color: #999; font-style: italic; text-align: center;">Sin evidencia fotográfica adjunta.</p>
            `}
            
          </div>
        `,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#56212f',
          width: '650px',
          didOpen: () => {
            const img = document.getElementById('img-evidencia-sup');
            if (img && imagenData) {
              img.onclick = () => this.abrirImagenCompleta(imagenData, ticket.id, { descripcion_resolucion: resolucion });
            }
          }
        });
      },
      error: (err) => {
        console.error("Error al recuperar evidencias:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudieron recuperar los datos de la base de datos. Verifique su conexión.',
          confirmButtonColor: '#56212f'
        });
      }
    });
  }

abrirImagenCompleta(imagenBase64: string, idTicket: number, ticket: any) {
    Swal.fire({
        title: `<span style="color: #ffffff;">Evidencia - Ticket #${idTicket}</span>`,
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
            <img src="${imagenBase64}" style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;">
            <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; width: 100%; text-align: left; border-left: 5px solid #c3b08f;">
              <p style="margin: 0; font-size: 1rem; color: #ffffff;">${ticket.descripcion_resolucion}</p>
            </div>
          </div>
        `,
        width: '850px',
        background: '#000000',
        showConfirmButton: false,
        showCloseButton: true
    });
}
}