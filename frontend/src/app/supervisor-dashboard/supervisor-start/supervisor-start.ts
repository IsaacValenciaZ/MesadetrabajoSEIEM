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
    pendientesFiltrados: any[] = [];
    completadosFiltrados: any[] = [];
    filtroPendientes: string = 'Todas';
    filtroCompletados: string = 'Todas';

  chartLinea: any;
  chartDona: any; 
  ticketsParaGrafica: any[] = []; 

  showKpiModal: boolean = false;
  kpiModalTitle: string = '';
  kpiModalList: any[] = [];

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

          this.aplicarFiltroPendientes();
          this.aplicarFiltroCompletados();
          
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

    // --- Badges de estado ---
    const esCompletado = ticketSeleccionado.estado === 'Completo' || ticketSeleccionado.estado === 'Completado';
    const ahora = new Date();
    const fechaLimite = ticketSeleccionado.fecha_limite ? new Date(ticketSeleccionado.fecha_limite) : null;
    const estaAtrasado = fechaLimite && (esCompletado
        ? (ticketSeleccionado.fecha_fin ? new Date(ticketSeleccionado.fecha_fin) > fechaLimite : false)
        : ahora > fechaLimite);

    const badgeAtrasado = estaAtrasado
        ? `<span style="background:#fff7ed; color:#c2410c; border:1.5px solid #fed7aa; padding:4px 12px; border-radius:999px; font-size:0.78rem; font-weight:800;">Atrasado</span>`
        : '';

    const badgeEstado = esCompletado
        ? `<span style="background:#f0fdf4; color:#166534; border:1.5px solid #bbf7d0; padding:4px 12px; border-radius:999px; font-size:0.78rem; font-weight:800;">Completado</span>`
        : `<span style="background:#fefce8; color:#854d0e; border:1.5px solid #fde68a; padding:4px 12px; border-radius:999px; font-size:0.78rem; font-weight:800;">Pendiente</span>`;

    const tecnicoHtml = ticketSeleccionado.personal
        ? `<div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
             <span class="material-symbols-outlined" style="font-size:1.2rem; color:#56212f;">engineering</span>
             <span style="font-weight:800; font-size:1rem; color:#0f172a;">${ticketSeleccionado.personal}</span>
           </div>`
        : `<p style="margin:4px 0 0 0; color:#94a3b8; font-style:italic; font-size:.9rem;">Sin asignar</p>`;

const secretariaHtml = ticketSeleccionado.nombre_creador
    ? `<div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
         <span class="material-symbols-outlined" style="font-size:1.2rem; color:#2980b9;">badge</span>
         <span style="font-weight:800; font-size:1rem; color:#0f172a;">
           ${ticketSeleccionado.nombre_creador}
         </span>
       </div>`
    : `<p style="margin:4px 0 0 0; color:#94a3b8; font-style:italic; font-size:.9rem;">No registrada</p>`;

    let htmlModal = `
      <div style="text-align:left; font-family:'Segoe UI', sans-serif; color:#1e293b;">

        <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:10px;">
          <h1 style="font-size:2.2rem; font-weight:900; margin:0; color:#0f172a; font-style:italic;">
            Ticket: #${ticketSeleccionado.id}
          </h1>
          <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; padding-top:6px;">
            ${badgeAtrasado}
            ${badgeEstado}
          </div>
        </div>

        <div style="display:flex; gap:40px; margin-bottom:25px;">
          <div>
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Hora Asignación</p>
            <p style="margin:4px 0 0 0; font-size:0.95rem; font-weight:600; color:#334155;">${ticketSeleccionado.fecha || 'N/A'}</p>
          </div>
          <div>
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Hora Término</p>
            <p style="margin:4px 0 0 0; font-size:0.95rem; font-weight:600; color:${esCompletado ? '#059669' : '#d97706'};">
              ${ticketSeleccionado.fecha_fin || 'Pendiente'}
            </p>
          </div>
        </div>

        <hr style="border:0; border-top:1px solid #f1f5f9; margin:20px 0;">

        <div style="display:flex; gap:40px; margin-bottom:25px;">
          <div>
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Solicitante</p>
            <p style="margin:4px 0 0 0; font-weight:800; font-size:1.1rem; color:#0f172a;">${ticketSeleccionado.nombre_usuario} ${ticketSeleccionado.apellido_usuario || ''}</p>
          </div>
          <div>
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Ext / Teléfono</p>
            <p style="margin:4px 0 0 0; font-weight:800; font-size:1.1rem; color:#0f172a;">${ticketSeleccionado.extension_tel || '-'}</p>
          </div>
        </div>

        <div style="display:flex; gap:40px; margin-bottom:25px;">
          <div style="flex:1;">
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Departamento</p>
            <p style="margin:4px 0 0 0; font-weight:500; font-size:1.05rem; color:#334155;">${ticketSeleccionado.departamento}</p>
          </div>
          <div style="flex:1;">
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Municipio</p>
            <p style="margin:4px 0 0 0; font-weight:500; font-size:1.05rem; color:#334155;">${ticketSeleccionado.municipio || '-'}</p>
          </div>
        </div>

        <div style="display:flex; gap:40px; margin-bottom:25px;">
          <div style="flex:1;">
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Técnico Asignado</p>
            ${tecnicoHtml}
          </div>
          <div style="flex:1;">
            <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Asignado por</p>
            ${secretariaHtml}
          </div>
        </div>

        <div style="margin-bottom:30px;">
          <p style="margin:0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Vía de Atención</p>
          <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
            <span class="material-symbols-outlined" style="font-size:1.3rem; color:${ticketSeleccionado.metodo_resolucion === 'Presencial' ? '#16a085' : (ticketSeleccionado.metodo_resolucion === 'Llamada / Remoto' ? '#2980b9' : '#94a3b8')};">
              ${ticketSeleccionado.metodo_resolucion === 'Presencial' ? 'engineering' : (ticketSeleccionado.metodo_resolucion === 'Llamada / Remoto' ? 'support_agent' : 'help_outline')}
            </span>
            <span style="font-weight:700; font-size:1rem; color:#334155;">
              ${ticketSeleccionado.metodo_resolucion || 'No especificada por la asignadora'}
            </span>
          </div>
        </div>

        <p style="margin:0 0 8px 0; font-size:0.75rem; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">Clasificación del Problema</p>
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; border:1px solid #e2e8f0; border-left:6px solid ${colorFondoCategoria}; border-radius:8px; padding:15px; margin-bottom:30px; box-shadow:0 2px 4px rgba(0,0,0,0.02); gap:10px;">
          <div style="display:flex; align-items:center; flex-wrap:wrap;">
            <span style="background-color:${colorFondoCategoria}; color:white; padding:4px 12px; border-radius:4px; font-size:0.85rem; font-weight:700; display:inline-block;">
              ${ticketSeleccionado.descripcion}
            </span>
            ${detallesExtraHtml}
          </div>
          <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
            <p style="margin:0; color:#64748b; font-size:0.85rem; font-weight:700;">Prio:</p>
            <span style="background-color:${colorPrioridad}; color:white; padding:4px 10px; border-radius:4px; font-size:0.8rem; font-weight:700; display:inline-block;">
              ${ticketSeleccionado.prioridad}
            </span>
          </div>
        </div>

        <div>
          <p style="margin:0 0 8px 0; font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Notas Adicionales</p>
          <div style="background-color:#f8fafc; border:1px solid #f1f5f9; border-radius:8px; padding:15px;">
            <p style="margin:0; font-size:0.95rem; color:#475569; line-height:1.5;">
              ${ticketSeleccionado.notas ? ticketSeleccionado.notas : '<em style="color:#cbd5e1;">Sin notas adicionales.</em>'}
            </p>
          </div>
        </div>

      </div>
    `;

    Swal.fire({
      html: htmlModal,
      width: '600px',
      showConfirmButton: esCompletado,
      confirmButtonText: '<span class="material-symbols-outlined" style="vertical-align:middle; margin-right:5px;">visibility</span> Ver Evidencias de Resolución',
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
              ${resolucion}
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
           
            const img = document.getElementById(`img-evidencia-${ticket.id}`);
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

abrirModalKpi(tipo: 'pendientes' | 'completados' | 'alta' | 'total') {
  this.showKpiModal = true;
  switch (tipo) {
    case 'pendientes':
      this.kpiModalTitle = 'Tickets Pendientes';
      this.kpiModalList  = [...this.listaPendientesHoy];
      break;
    case 'completados':
      this.kpiModalTitle = 'Tickets Completados';
      this.kpiModalList  = [...this.listaCompletadosHoy];
      break;
    case 'alta':
      this.kpiModalTitle = 'Tickets de Prioridad Alta';
      this.kpiModalList  = this.ticketsParaGrafica.filter(t => t.prioridad === 'Alta' && t.estado !== 'Completo');
      break;
    case 'total':
      this.kpiModalTitle = 'Todos los Tickets de Hoy';
      this.kpiModalList  = [...this.ticketsParaGrafica];
      break;
  }
  this.cdr.detectChanges();
}

cerrarModalKpi() {
  this.showKpiModal = false;
  this.kpiModalList = [];
  this.cdr.detectChanges();
}


aplicarFiltroPendientes(categoria?: string) {
    if (categoria) this.filtroPendientes = categoria;
    
    if (this.filtroPendientes === 'Todas') {
      this.pendientesFiltrados = [...this.listaPendientesHoy];
    } else {
      this.pendientesFiltrados = this.listaPendientesHoy.filter(t => t.descripcion === this.filtroPendientes);
    }
    this.cdr.detectChanges();
  }

  aplicarFiltroCompletados(categoria?: string) {
    if (categoria) this.filtroCompletados = categoria;
    
    if (this.filtroCompletados === 'Todas') {
      this.completadosFiltrados = [...this.listaCompletadosHoy];
    } else {
      this.completadosFiltrados = this.listaCompletadosHoy.filter(t => t.descripcion === this.filtroCompletados);
    }
    this.cdr.detectChanges();
  }
}