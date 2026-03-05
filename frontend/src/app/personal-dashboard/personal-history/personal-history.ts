import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables); 

@Component({
  selector: 'app-personal-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-history.html',
  styleUrls: ['../personal-dashboard.css', './personal-history.css'] 
})
export class PersonalHistoryComponent implements OnInit {

  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  user: any = {};
  cargando = true;
  ticketsTodos: any[] = []; 
  ticketsFiltrados: any[] = []; 
  
  diasCalendario: any[] = [];
  diaSeleccionado: number | null = null;
  mostrarCalendario: boolean = false;
  mesesDisponibles: string[] = [];
  mesSeleccionado: string = ''; 
  gruposPorDia: { fecha: string, tickets: any[] }[] = [];

  ngOnInit() {
    const userStored = localStorage.getItem('usuario_actual');
    if (userStored) {
      this.user = JSON.parse(userStored);
      this.cargarHistorialTickets();
    }
  }

  toggleCalendario() {
    this.mostrarCalendario = !this.mostrarCalendario;
       if (this.ticketsTodos.length === 0) { 
        Swal.fire({
            title: 'Datos insuficientes', 
            text: 'No hay historial para generar reporte.', 
            icon: 'info', 
            iconColor: '#56212f',
            confirmButtonText: 'Cerrar', 
            confirmButtonColor: '#000000'
          });
              return; 
          }
  }

  cargarHistorialTickets() {
    this.cargando = true;
    
    this.apiService.getMisTickets(this.user.nombre).subscribe({
      next: (datosServidor) => {
        const registros = datosServidor || [];
        
        this.ticketsTodos = registros.filter((ticket: any) => 
            ticket.estado === 'Completo' || 
            ticket.estado === 'Incompleto' || 
            ticket.estado === 'Completado'
        );
        
        this.generarOpcionesMeses();

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        
        const mesActual = `${anio}-${mes}`; 
        const fechaHoy = `${anio}-${mes}-${dia}`; 

        if (this.mesesDisponibles.includes(mesActual)) {
            this.mesSeleccionado = mesActual;
        } else if (this.mesesDisponibles.length > 0) {
            this.mesSeleccionado = this.mesesDisponibles[0];
        } else {
            this.mesSeleccionado = '';
        }

        this.aplicarFiltroMes(false); 

        const ticketsDeHoy = this.ticketsFiltrados.filter(ticket => 
            ticket.fecha && ticket.fecha.startsWith(fechaHoy)
        );

        if (ticketsDeHoy.length > 0) {
            this.diaSeleccionado = parseInt(dia);
            this.organizarTicketsPorFecha(ticketsDeHoy);
        } else {
            this.diaSeleccionado = null;
            this.organizarTicketsPorFecha(this.ticketsFiltrados);
        }

        this.cargando = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al cargar el historial:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  generarOpcionesMeses() {
      const mesesUnicos = new Set<string>();
      
      this.ticketsTodos.forEach(ticket => {
          if (ticket.fecha) {
             const mesAnio = ticket.fecha.substring(0, 7);
             mesesUnicos.add(mesAnio);
          }
      });
      
      this.mesesDisponibles = Array.from(mesesUnicos).sort().reverse();
  }

  aplicarFiltroMes(limpiarSeleccion: boolean = true) {
      if (limpiarSeleccion) {
          this.diaSeleccionado = null; 
      }
      
      if (!this.mesSeleccionado) {
          this.ticketsFiltrados = this.ticketsTodos;
      } else {
          this.ticketsFiltrados = this.ticketsTodos.filter(ticket => 
              ticket.fecha && ticket.fecha.startsWith(this.mesSeleccionado)
          );
      }
      
      this.construirMatrizCalendario(); 
      
      if (limpiarSeleccion) {
          this.organizarTicketsPorFecha(this.ticketsFiltrados);
      }
  }

  construirMatrizCalendario() {
    if (!this.mesSeleccionado) return;

    const [anioStr, mesStr] = this.mesSeleccionado.split('-');
    const anio = parseInt(anioStr);
    const mes = parseInt(mesStr);

    const primerDiaSemana = new Date(anio, mes - 1, 1).getDay(); 
    const totalDiasMes = new Date(anio, mes, 0).getDate(); 

    this.diasCalendario = [];

    for (let i = 0; i < primerDiaSemana; i++) {
        this.diasCalendario.push({ dia: null, tickets: [] });
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const fechaFormateada = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const ticketsDelDia = this.ticketsFiltrados.filter(ticket => 
            ticket.fecha && ticket.fecha.startsWith(fechaFormateada)
        );

        this.diasCalendario.push({
            dia: dia,
            fechaCompleta: fechaFormateada,
            tickets: ticketsDelDia,
            tieneTickets: ticketsDelDia.length > 0
        });
    }
  }

  seleccionarDia(diaCalendario: any) {
    if (!diaCalendario.dia) return; 
    
    if (this.diaSeleccionado === diaCalendario.dia) {
        this.diaSeleccionado = null;
        this.organizarTicketsPorFecha(this.ticketsFiltrados); 
    } else {
        this.diaSeleccionado = diaCalendario.dia;
        this.organizarTicketsPorFecha(diaCalendario.tickets); 
        this.mostrarCalendario = false; 
    }
  }

  organizarTicketsPorFecha(listaTickets: any[]) {
    if (!listaTickets || listaTickets.length === 0) {
        this.gruposPorDia = [];
        return;
    }

    const ticketsAgrupados: { [key: string]: any[] } = {};
    
    listaTickets.forEach(ticket => {
      if (ticket.fecha) { 
          const fechaSinHora = ticket.fecha.split(' ')[0]; 
          if (!ticketsAgrupados[fechaSinHora]) {
              ticketsAgrupados[fechaSinHora] = [];
          }
          ticketsAgrupados[fechaSinHora].push(ticket);
      }
    });

    this.gruposPorDia = Object.keys(ticketsAgrupados)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(fecha => ({ fecha: fecha, tickets: ticketsAgrupados[fecha] }));
  }

  obtenerNombreMes(formatoMesAnio: string): string {
      if (!formatoMesAnio) return '';
      const [anio, mes] = formatoMesAnio.split('-');
      const fechaReferencia = new Date(parseInt(anio), parseInt(mes) - 1, 1);
      const nombreMes = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(fechaReferencia);
      
      return `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${anio}`;
  }

  obtenerClaseCategoria(descripcion: string): string {
    const clases: {[key: string]: string} = {
      'Internet': 'cat-internet',
      'Office': 'cat-office',
      'Telefonia': 'cat-telefonia',
      'Tecnico': 'cat-tecnico',
      'Dictaminar': 'cat-dictaminar',
      'Extension/Telefono': 'cat-extension',
      'Correo': 'cat-correo'
    };
    return clases[descripcion] || '';
  }

  obtenerClasePrioridad(prioridad: string): string {
    const clases: {[key: string]: string} = {
      'Alta': 'prio-alta',
      'Media': 'prio-media',
      'Baja': 'prio-baja'
    };
    return clases[prioridad] || '';
  }

  obtenerColorEstado(estado: string): string {
    if (estado === 'En espera') return '#8a772d';
    if (estado === 'Incompleto') return '#e74c3c';
    return '#dcfce7'; 
  }

abrirModalTicket(ticketSeleccionado: any) {
    let detallesExtraHtml = '';
    let colorFondoCategoria = '#64748b'; 

    if (ticketSeleccionado.descripcion === 'Internet') colorFondoCategoria = '#2980b9';
    else if (ticketSeleccionado.descripcion === 'Office') colorFondoCategoria = '#d35400';
    else if (ticketSeleccionado.descripcion === 'Telefonia') colorFondoCategoria = '#2c3e50';
    else if (ticketSeleccionado.descripcion === 'Extension/Telefono') colorFondoCategoria = '#94961c';
    else if (ticketSeleccionado.descripcion === 'Dictaminar') {
        colorFondoCategoria = '#6c5ce7';
        if (ticketSeleccionado.cantidad_dicta) {
          detallesExtraHtml = `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.95rem; font-weight: 800; color: ${colorFondoCategoria};">Equipos: ${ticketSeleccionado.cantidad_dicta}</span>`;
        }
    } 
    else if (ticketSeleccionado.descripcion === 'Correo') {
        colorFondoCategoria = '#96241c';
        if (ticketSeleccionado.correo_tipo) {
          detallesExtraHtml = `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.95rem; font-weight: 800; color: ${colorFondoCategoria};">Dominio: ${ticketSeleccionado.correo_tipo}</span>`;
        }
    } 
    else if (ticketSeleccionado.descripcion === 'Tecnico') {
        colorFondoCategoria = '#16a085';
        if (ticketSeleccionado.soporte_tipo) {
          detallesExtraHtml = `<span style="color: #cbd5e1; margin: 0 10px;">|</span> <span style="font-size: 0.95rem; font-weight: 800; color: ${colorFondoCategoria};">Soporte: ${ticketSeleccionado.soporte_tipo}</span>`;
        }
    }

    let colorPrioridad = '#64748b';
    if (ticketSeleccionado.prioridad === 'Alta') colorPrioridad = '#c0392b';
    else if (ticketSeleccionado.prioridad === 'Media') colorPrioridad = '#f39c12';
    else if (ticketSeleccionado.prioridad === 'Baja') colorPrioridad = '#27ae60';

    const fechaFormat = ticketSeleccionado.fecha ? new Date(ticketSeleccionado.fecha).toLocaleString('es-MX', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'N/A';
    const fechaFinFormat = ticketSeleccionado.fecha_fin ? new Date(ticketSeleccionado.fecha_fin).toLocaleString('es-MX', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'N/A';

    let metricaHtml = '';
    if (ticketSeleccionado.estado !== 'Incompleto') {
        if (ticketSeleccionado.fecha_fin <= ticketSeleccionado.fecha_limite) {
            metricaHtml = `<span style="background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">A Tiempo</span>`;
        } else {
             metricaHtml = `<span style="background-color: #fefae2; color: #e09a31; border: 1px solid #fee7ca; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; animation: pulse 2s infinite;">Atrasado</span>`;
        }
    } else {
         metricaHtml = `<span style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; animation: pulse 2s infinite;">Caducado</span>`;
    }

    const colorFondoEstado = this.obtenerColorEstado(ticketSeleccionado.estado);
    const colorTextoEstado = ticketSeleccionado.estado === 'Incompleto' ? '#ffffff' : '#166534';

    const htmlModal = `
      <div style="text-align: left; font-family: 'Segoe UI', sans-serif; color: #1e293b;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; margin-bottom: 15px; gap: 10px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px;">Ticket:  #${ticketSeleccionado.id} </h2>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${metricaHtml}
              <span style="background-color: ${colorFondoEstado}; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; color: ${colorTextoEstado}; display: inline-block;">
                ${ticketSeleccionado.estado === 'Completo' ? 'Completado' : 'Incumplido'} 
              </span>
          </div>
        </div>

        <div style="display: flex; gap: 30px; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap;">
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Hora Asignación</p>
            <p style="margin: 2px 0 0 0; font-size: 0.95rem; font-weight: 600; color: #475569;">${fechaFormat}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Hora Término</p>
            <p style="margin: 2px 0 0 0; font-size: 0.95rem; font-weight: 600; color: #56212f;">${fechaFinFormat}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Solicitante</p>
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a; word-break: break-word;">${ticketSeleccionado.nombre_usuarios || ticketSeleccionado.nombre_usuario}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ext / Teléfono</p>
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a; word-break: break-word;">${ticketSeleccionado.extension_tel || '-'}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Departamento</p>
          <p style="margin: 4px 0 0 0; font-weight: 500; font-size: 1.05rem; color: #334155; word-break: break-word;">${ticketSeleccionado.departamento}</p>
        </div>

        <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: 64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;  display: inline-block; padding: 4px 8px; border-radius: 4px;">Clasificación del Problema</p>
        
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; border: 1px solid #e2e8f0; border-left: 6px solid ${colorFondoCategoria}; border-radius: 8px; padding: 15px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); gap: 10px;">
          <div style="display: flex; align-items: center; flex-wrap: wrap;">
            <span style="background-color: ${colorFondoCategoria}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700; display: inline-block;">
              ${ticketSeleccionado.descripcion}
            </span>
            ${detallesExtraHtml}
          </div>
          <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
             <p style="margin:0; color: #64748b; font-size: 0.85rem; font-weight: 700;">Prio:</p>
             <span style="background-color: ${colorPrioridad}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; display: inline-block;">
               ${ticketSeleccionado.prioridad}
             </span>
          </div>
        </div>

        <div>
          <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Notas Adicionales</p>
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 15px;">
            <p style="margin: 0; font-size: 0.95rem; color: #475569; line-height: 1.5;">
              ${ticketSeleccionado.notas ? ticketSeleccionado.notas : '<em style="color: #cbd5e1;">Sin notas adicionales.</em>'}
            </p>
          </div>
        </div>

      </div>
    `;

    Swal.fire({
      html: htmlModal,
      width: '600px',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '<span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.1rem; margin-right: 5px;">visibility</span> Ver Resolución',
      confirmButtonColor: '#56212f', 
      denyButtonText: '<span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.1rem; margin-right: 5px;">refresh</span> Reabrir Ticket',
      denyButtonColor: '#b45309', 
      cancelButtonText: 'Cerrar',
      cancelButtonColor: '#000000', 
      padding: '2em',
      showConfirmButton: !!(ticketSeleccionado.descripcion_resolucion || ticketSeleccionado.evidencia_archivo || ticketSeleccionado.firma_base64) 
    }).then((result) => {
      if (result.isConfirmed) {
        this.verEvidenciaFinal(ticketSeleccionado);
      } else if (result.isDenied) {
        this.cambiarEstado(ticketSeleccionado);
      }
    });
  }

  verEvidenciaFinal(ticket: any) {
      const imagenData = ticket.evidencia_archivo; 

      Swal.fire({
        title: `Resolución del Ticket #${ticket.id}`,
        html: `
          <div style="text-align: left; padding: 5px;">
            <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">Descripción de la solución:</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 5px solid #27ae60; margin-bottom: 15px; max-height: 150px; overflow-y: auto;">
              ${ticket.descripcion_resolucion || 'El técnico no proporcionó una descripción de las tareas realizadas.'}
            </div>

            ${ticket.firma_base64 ? `
              <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">Firma de conformidad:</p>
              <div style="text-align: center; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; background: #ffffff; margin-bottom: 15px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                <img src="${ticket.firma_base64}" style="width: 100%; max-height: 120px; object-fit: contain;">
              </div>
            ` : ''}
            
            ${imagenData ? `
              <p style="font-weight: bold; color: #56212f; margin-bottom: 5px;">Evidencia fotográfica:</p>
              <div style="text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 8px; background: #1a1a1a;">
                <img id="img-evidencia-${ticket.id}" src="${imagenData}" 
                     style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 4px; cursor: zoom-in; transition: transform 0.2s;"
                     onmouseover="this.style.transform='scale(1.02)'"
                     onmouseout="this.style.transform='scale(1)'">
                <small style="display:block; color: #aaa; margin-top: 8px; font-weight: bold;">
                  <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">zoom_in</span> 
                  Haz clic en la imagen para ampliarla
                </small>
              </div>
            ` : '<p style="color: #999; font-style: italic; text-align: center;">Sin evidencia fotográfica adjunta.</p>'}
          </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#56212f',
        width: '650px',
        didOpen: () => {
          if (imagenData) {
            const visorImagen = document.getElementById(`img-evidencia-${ticket.id}`);
            if (visorImagen) {
                visorImagen.addEventListener('click', () => {
                this.abrirImagenCompleta(imagenData, ticket.id, ticket);
              });
            }
          }
        }
      });
  }

abrirImagenCompleta(imagenBase64: string, idTicket: number, ticket: any) {
      const resolucionTexto = ticket.descripcion_resolucion ? ticket.descripcion_resolucion : 'No se agregó descripción de resolución.';

      Swal.fire({
        title: `<span style="color: #ffffff; font-size: 1.6rem; font-weight: 800;">Evidencia - Ticket #${idTicket}</span>`,
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 20px; margin-top: 15px;">
            
            <div style="width: 100%; display: flex; justify-content: center; background: #000; border-radius: 8px; padding: 10px;">
                <img src="${imagenBase64}" 
                     alt="Evidencia técnica adjunta" 
                     style="max-width: 100%; max-height: 60vh; object-fit: contain; border-radius: 4px;">
            </div>

            <div style="background: rgba(255, 255, 255, 0.1); padding: 15px 20px; border-radius: 8px; width: 100%; text-align: left; border-left: 5px solid #d4a055; box-sizing: border-box;">
              <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                 Notas de la resolución
              </p>
              <p style="margin: 0; font-size: 1.1rem; color: #ffffff; line-height: 1.5;">
                ${resolucionTexto}
              </p>
            </div>
            
          </div>
        `,
        width: '850px',
        padding: '2em',
        background: '#000000',
        backdrop: `rgba(0,0,0,0.9)`, 
        showConfirmButton: false,  
        showCloseButton: true,
        closeButtonHtml: '<span style="color: #ffffff; font-size: 2rem;">&times;</span>',
        customClass: {
          popup: 'swal-evidencia-dark'
        }
      });
  }

 cambiarEstado(ticket: any) {
  Swal.fire({
    title: `¿Reabrir reporte del ticket #${ticket.id}?`,
    html: `
      <p style="color:red; font-weight:bold;">
        Antes de reabrir el ticket necesitas saber:
      </p>

      <ul style="text-align:left; margin-top:10px;">
        <li>- Tu estado se mantendrá como <b style="color:green; font-weight:bold;"> "Disponible" </b>y te podran asignar nuevos tickets.</li>
        <li>- Si el ticket caducó afectará tus estadísticas al reabrir.</li>
        <li>- Si el ticket se abre dentro del tiempo estimado no afecta tus estadísticas.</li>
      </ul>

      <p style="margin-top:15px;">
        ¿Deseas continuar?
      </p>
    `,
    icon: 'question',
    iconColor: '#56212f',
    showCancelButton: true,
    confirmButtonText: 'Sí, reabrir',
    confirmButtonColor: '#56212f',
    cancelButtonText: 'Cancelar',
    cancelButtonColor: '#000000'
  }).then((resultado) => {
    if (resultado.isConfirmed) {
      this.guardarNuevoEstado(ticket.id, 'En espera');
    }
  });
}


  guardarNuevoEstado(idTicket: number, estadoActualizado: string) {
    this.apiService.actualizarEstadoTicket(idTicket, estadoActualizado).subscribe({
      next: (respuesta) => {
        if (respuesta.status === true) {
          const alertaNotificacion = Swal.mixin({ 
              toast: true, 
              position: 'top-end', 
              showConfirmButton: false, 
              timer: 3000, 
              timerProgressBar: true 
          });
          alertaNotificacion.fire({ icon: 'success', title: 'Estado actualizado correctamente' });
          this.cargarHistorialTickets(); 
        } else { 
            Swal.fire('Error', 'No se pudo actualizar el estado en el servidor.', 'error'); 
        }
      }
    });
  }

  calcularEstadisticas(listaTickets: any[]) {
      const estadisticas = {
          total: listaTickets.length,
          completos: 0,
          vencidos: 0,
          aTiempo: 0,
          tarde: 0,
          rapido: 0,
          normal: 0,
          lento: 0,
          tiempoPromedio: 'N/A'
      };

      let sumaMinutosTotales = 0; 
      let ticketsConTiempoValido = 0;
      
      listaTickets.forEach(ticket => {
         if (ticket.estado === 'Completo' || ticket.estado === 'Completado') {
            estadisticas.completos++;
            
            if (ticket.fecha_fin && ticket.fecha_limite) { 
                if (ticket.fecha_fin <= ticket.fecha_limite) {
                    estadisticas.aTiempo++; 
                } else {
                    estadisticas.tarde++; 
                }
            } else { 
                estadisticas.tarde++; 
            }
            
            if (ticket.fecha && ticket.fecha_fin) {
               const tiempoInicio = new Date(ticket.fecha).getTime(); 
               const tiempoFin = new Date(ticket.fecha_fin).getTime(); 
               const diferenciaMs = tiempoFin - tiempoInicio; 
               
               if (diferenciaMs > 0) {
                  const minutosTranscurridos = diferenciaMs / (1000 * 60); 
                  sumaMinutosTotales += minutosTranscurridos; 
                  ticketsConTiempoValido++;
                  
                  if (minutosTranscurridos < 60) estadisticas.rapido++; 
                  else if (minutosTranscurridos <= 1440) estadisticas.normal++; 
                  else estadisticas.lento++;
               }
            }
         } else if (ticket.estado === 'Incompleto') { 
             estadisticas.vencidos++; 
         }
      });
      
      if (ticketsConTiempoValido > 0) {
         const promedioMins = Math.round(sumaMinutosTotales / ticketsConTiempoValido); 
         const horas = Math.floor(promedioMins / 60); 
         const minutos = promedioMins % 60; 
         estadisticas.tiempoPromedio = `${horas}h ${minutos}m`;
      }

      return estadisticas;
  }

  verEstadisticasDia(grupo: any) {
      const resultados = this.calcularEstadisticas(grupo.tickets);
      const diseñoHtml = `
        <div style="padding: 10px;">
          <h3 style="color:#56212f; margin-top:0;">Resumen del Día</h3>
          <p style="color:#666; margin-bottom: 20px;">Fecha analizada: <strong>${grupo.fecha}</strong> | Total de reportes: <strong>${resultados.total}</strong></p>
          <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 15px;">
              <div style="width: 160px;"> 
                  <h6 style="margin-bottom: 5px; font-weight:700;">Estatus</h6> 
                  <canvas id="graficaEstatusDia" width="160" height="160"></canvas> 
              </div>
              <div style="width: 160px;"> 
                  <h6 style="margin-bottom: 5px; font-weight:700;">Puntualidad</h6> 
                  <canvas id="graficaPuntualidadDia" width="160" height="160"></canvas> 
              </div>
               <div style="width: 160px;"> 
                   <h6 style="margin-bottom: 5px; font-weight:700;">Tiempos de Solución</h6> 
                   <canvas id="graficaTiemposDia" width="160" height="160"></canvas> 
               </div>
          </div>
          <div style="margin-top: 20px; background: #f8f9fa; padding: 10px; border-radius: 10px;">
              <h3 style="color: #56212f; margin: 0;">⏱️ ${resultados.tiempoPromedio}</h3> 
              <small style="color: #888;">Tiempo promedio de respuesta</small>
          </div>
        </div>`;
        
      Swal.fire({ 
          html: diseñoHtml, 
          width: '750px', 
          showConfirmButton: false, 
          showCloseButton: true, 
          didOpen: () => { 
              this.renderizarGraficasCJS('graficaEstatusDia', 'graficaPuntualidadDia', 'graficaTiemposDia', resultados); 
          } 
      });
  }

  verResumenMensual() {
    const listaAnalisis = this.ticketsFiltrados;
    
    if (listaAnalisis.length === 0) { 
        Swal.fire({
            title: 'Datos insuficientes', 
            text: 'No hay historial para generar reporte.', 
            icon: 'info', 
            iconColor: '#56212f',
            confirmButtonText: 'Cerrar', 
            confirmButtonColor: '#000000'
          });
              return; 
          }

    
    const resultados = this.calcularEstadisticas(listaAnalisis);
    const etiquetaMes = this.obtenerNombreMes(this.mesSeleccionado);
    
    const diseñoHtml = `
      <div style="padding: 10px;">
        <h3 style="color:#56212f; margin-top:0;">Estadísticas de ${etiquetaMes}</h3>
        <p style="color:#666; margin-bottom: 20px;">Analizando un volumen de <strong>${resultados.total}</strong> reportes</p>
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
            <div style="width: 200px;"> 
                <h5 style="margin-bottom: 10px;">Estatus</h5> 
                <canvas id="graficaEstatusMes" width="200" height="200"></canvas> 
            </div>
            <div style="width: 200px;"> 
                <h5 style="margin-bottom: 10px;">Puntualidad</h5> 
                <canvas id="graficaPuntualidadMes" width="200" height="200"></canvas> 
            </div>
             <div style="width: 200px;"> 
                 <h5 style="margin-bottom: 10px;">Distribución de Tiempos</h5> 
                 <canvas id="graficaTiemposMes" width="200" height="200"></canvas> 
             </div>
        </div>
        <div style="margin-top: 30px; background: #f8f9fa; padding: 15px; border-radius: 10px;">
            <h3 style="color: #56212f; margin: 0;"> ${resultados.tiempoPromedio}</h3> 
            <small style="color: #888;">Tiempo promedio de solución en el periodo actual</small>
        </div>
      </div>`;
      
    Swal.fire({ 
        html: diseñoHtml, 
        width: '850px', 
        showConfirmButton: false, 
        showCloseButton: true, 
        didOpen: () => { 
            this.renderizarGraficasCJS('graficaEstatusMes', 'graficaPuntualidadMes', 'graficaTiemposMes', resultados); 
        } 
    });
  }

  renderizarGraficasCJS(idEstatus: string, idPuntualidad: string, idTiempos: string, metricas: any) {
      const contextoEstatus = document.getElementById(idEstatus) as HTMLCanvasElement;
      if (contextoEstatus) { 
          new Chart(contextoEstatus, { 
              type: 'doughnut', 
              data: { 
                  labels: ['Completados', 'Vencidos'], 
                  datasets: [{ 
                      data: [metricas.completos, metricas.vencidos], 
                      backgroundColor: ['#28f328', '#f32828'], 
                      hoverOffset: 4 
                  }] 
              }, 
              options: { responsive: true, plugins: { legend: { position: 'bottom' } } } 
          }); 
      }
      
      const contextoPuntualidad = document.getElementById(idPuntualidad) as HTMLCanvasElement;
      if (contextoPuntualidad) { 
          new Chart(contextoPuntualidad, { 
              type: 'pie', 
              data: { 
                  labels: ['A tiempo', 'Con retraso', 'Caducado'], 
                  datasets: [{ 
                      data: [metricas.aTiempo, metricas.tarde, metricas.vencidos], 
                      backgroundColor: ['#28f328', '#f3f028', '#f32828'], 
                      hoverOffset: 4 
                  }] 
              }, 
              options: { responsive: true, plugins: { legend: { position: 'bottom' } } } 
          }); 
      }
      
      const contextoTiempos = document.getElementById(idTiempos) as HTMLCanvasElement;
      if (contextoTiempos) { 
          new Chart(contextoTiempos, { 
              type: 'bar', 
              data: { 
                  labels: ['< 1h', '1h - 24h', '> 24h'], 
                  datasets: [{ 
                      label: 'Volumen de Reportes', 
                      data: [metricas.rapido, metricas.normal, metricas.lento], 
                      backgroundColor: ['#28f328', '#f3f028', '#f32828'], 
                      borderRadius: 5 
                  }] 
              }, 
              options: { 
                  responsive: true, 
                  plugins: { legend: { display: false } }, 
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } 
              } 
          }); 
      }
  }
}