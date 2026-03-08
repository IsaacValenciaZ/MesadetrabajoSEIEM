import { Component, OnInit, OnDestroy ,inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-personal-pending',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './personal-pending.html',
  styleUrls: ['./personal-pending.css'] 
})
export class PersonalPendingComponent implements OnInit {

  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private pollingSubscription: Subscription | undefined;

  usuarioActual: any = {};
  listaTicketsPendientes: any[] = []; 
  cargandoDatos = true;
  fechaReferenciaActual = new Date(); 

  ngOnInit() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      this.usuarioActual = JSON.parse(usuarioGuardado);
      this.obtenerTicketsPendientes();

      this.pollingSubscription = interval(15000).subscribe(() => {
          this.obtenerTicketsPendientesSilenicoso();
      });
    }
  }

  obtenerTicketsPendientesSilenicoso() {
      this.ejecutarLlamadaApi();
  }

  private ejecutarLlamadaApi() {
    this.apiService.getMisTickets(this.usuarioActual.nombre).subscribe({
      next: (datosDelServidor) => {
        const todosLosTickets = datosDelServidor || [];
        this.fechaReferenciaActual = new Date();
      
        const idsAntiguos = this.listaTicketsPendientes.map(t => t.id);

        const nuevaListaTickets = todosLosTickets.filter((ticket: any) => 
            ticket.estado === 'En espera' || ticket.estado === 'Asignado' || !ticket.estado
        );
    
        nuevaListaTickets.sort((a, b) => {
             return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
        });
        
        const idsNuevos = nuevaListaTickets.map(t => t.id);
        const hayTicketsNuevos = idsNuevos.some(id => !idsAntiguos.includes(id));
        
        this.listaTicketsPendientes = nuevaListaTickets;
        this.cargandoDatos = false;
        this.cdr.detectChanges(); 
        
        if(hayTicketsNuevos && idsAntiguos.length > 0) {
             const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
             });
             Toast.fire({ icon: 'info', iconColor: '#56212f', title: '¡Tienes nuevos reportes asignados!' });
        }

      },
      error: (err) => {
        this.cargandoDatos = false;
        this.cdr.detectChanges();
      }
    });
  }
  obtenerTicketsPendientes() {
    this.cargandoDatos = true;
    this.ejecutarLlamadaApi();
    
    this.apiService.getMisTickets(this.usuarioActual.nombre).subscribe({
      next: (datosDelServidor) => {
        const todosLosTickets = datosDelServidor || [];
        this.fechaReferenciaActual = new Date();
      
        this.listaTicketsPendientes = todosLosTickets.filter((ticket: any) => 
            ticket.estado === 'En espera' || ticket.estado === 'Asignado' || !ticket.estado
        );
    
        this.listaTicketsPendientes.sort((a, b) => {
             return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
        });
        
        this.cargandoDatos = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.cargandoDatos = false;
        this.cdr.detectChanges();
      }
    });
  }

  verificarVencimiento(fechaLimite: string): boolean {
    if (!fechaLimite) return false;
    return new Date(fechaLimite) < this.fechaReferenciaActual;
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

    const htmlModal = `
      <div style="text-align: left; font-family: 'Segoe UI', sans-serif; color: #1e293b;">
        
        <h1 style="font-size: 2.2rem; font-weight: 900; margin: 0 0 20px 0; color: #0f172a; font-style: italic;">Ticket:  #${ticketSeleccionado.id}</h1>

        <div style="display: flex; gap: 40px; margin-bottom: 25px;">
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Fecha de Solicitud</p>
            <p style="margin: 4px 0 0 0; font-size: 0.95rem; font-weight: 600; color: #334155;">${ticketSeleccionado.fecha || 'N/A'}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Vencimiento</p>
            <p style="margin: 4px 0 0 0; font-size: 0.95rem; font-weight: 600; color: #d97706;">${ticketSeleccionado.fecha_limite || 'N/A'}</p>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">

        <div style="display: flex; gap: 40px; margin-bottom: 25px;">
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Solicitante</p>
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticketSeleccionado.nombre_usuario}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ext / Teléfono</p>
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticketSeleccionado.extension_tel || '-'}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Departamento</p>
          <p style="margin: 4px 0 0 0; font-weight: 500; font-size: 1.05rem; color: #334155;">${ticketSeleccionado.departamento}</p>
        </div>

        <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: 64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;  display: inline-block; padding: 4px 8px; border-radius: 4px;">Clasificación del Problema</p>
        
        <div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #e2e8f0; border-left: 6px solid ${colorFondoCategoria}; border-radius: 8px; padding: 15px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; flex-wrap: wrap;">
            <span style="background-color: ${colorFondoCategoria}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700;">
              ${ticketSeleccionado.descripcion}
            </span>
            ${detallesExtraHtml}
          </div>
          <p style="color: #64748b; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700; white-space: nowrap;">Prio:</p>
          <span style="background-color: ${colorPrioridad}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: 700; white-space: nowrap;">
            ${ticketSeleccionado.prioridad}
          </span>
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
      showCancelButton: true,
      confirmButtonText: '<span class="material-symbols-outlined" style="vertical-align: middle; font-size: 1.2rem; margin-right: 5px;">check_circle</span> Completar Ticket',
      confirmButtonColor: '#56212f',
      cancelButtonText: 'Cerrar',
      cancelButtonColor: '#000000'
    }).then((result) => {
      if (result.isConfirmed) {
        this.abrirModalFinalizacion(ticketSeleccionado);
      }
    });
  }

  abrirModalFinalizacion(ticketSeleccionado: any) {

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;
    let isDrawing = false;
    let isEmpty = true;

Swal.fire({
      title: `Finalizar Ticket #${ticketSeleccionado.id}`,
      html: `
        <div style="text-align: left;">
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 10px;">Documenta la solución y solicita la firma de conformidad.</p>
          
          <label style="font-weight: 800; color: #56212f; font-size: 0.95rem;">Resolución del problema:</label>
          <textarea id="solucion-text" class="swal2-textarea" style="margin: 5px 0 15px 0; width: 100%; height: 80px; box-sizing: border-box; font-family: inherit; font-size: 0.95rem; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="Ej. Se reemplazó el cable de red..."></textarea>
          
          <label style="font-weight: 800; color: #56212f; font-size: 0.95rem; display: block;">Firma del Solicitante:</label>
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; margin-top: 5px; touch-action: none;">
             <canvas id="firma-canvas" style="width: 100%; height: 180px; cursor: crosshair;"></canvas>
          </div>
          <div style="text-align: right; margin-top: 5px; margin-bottom: 15px;">
             <button type="button" id="btn-limpiar-firma" style="background: none; border: none; color: #b45309; text-decoration: underline; cursor: pointer; font-size: 0.85rem; font-weight: bold;">Limpiar Firma</button>
          </div>

          <label style="font-weight: 800; color: #56212f; font-size: 0.95rem; display: block;">Evidencia Fotográfica:</label>
          <input type="file" id="evidencia-file" class="swal2-file" accept="image/*" style="width: 100%; margin: 5px 0 0 0; box-sizing: border-box; padding: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar y Cerrar',
      confirmButtonColor: '#56212f',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#000000',
     width: '600px',
      didOpen: () => {
        canvas = document.getElementById('firma-canvas') as HTMLCanvasElement;
        ctx = canvas.getContext('2d');
        const btnLimpiar = document.getElementById('btn-limpiar-firma');

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const getPos = (evt: MouseEvent | TouchEvent) => {
            const rectInfo = canvas.getBoundingClientRect();
            let clientX, clientY;
            if (evt instanceof MouseEvent) {
                clientX = evt.clientX;
                clientY = evt.clientY;
            } else {
                clientX = evt.touches[0].clientX;
                clientY = evt.touches[0].clientY;
            }
            return { x: clientX - rectInfo.left, y: clientY - rectInfo.top };
        };

        const startDrawing = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            isDrawing = true;
            isEmpty = false;
            const pos = getPos(e);
            ctx?.beginPath();
            ctx?.moveTo(pos.x, pos.y);
        };

        const draw = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            if (!isDrawing || !ctx) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = '#0f172a'; 
            ctx.lineWidth = 2.5; 
            ctx.lineCap = 'round';
            ctx.stroke();
        };

        const stopDrawing = () => {
            isDrawing = false;
            ctx?.closePath();
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        btnLimpiar?.addEventListener('click', () => {
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            isEmpty = true;
        });
      },
      preConfirm: () => {
        const descripcionResolucion = (document.getElementById('solucion-text') as HTMLTextAreaElement).value;
        const archivoEvidencia = (document.getElementById('evidencia-file') as HTMLInputElement).files?.[0];

        if (!descripcionResolucion || descripcionResolucion.trim() === '') {
          Swal.showValidationMessage('La descripción de la solución es obligatoria');
          return false;
        }

        if (isEmpty) {
          Swal.showValidationMessage('La firma de conformidad es obligatoria');
          return false;
        }
        
        const firmaBase64 = canvas.toDataURL('image/png');

        return { resolucion: descripcionResolucion, archivo: archivoEvidencia, firma: firmaBase64 };
      }
    }).then((resultadoModal) => {
      if (resultadoModal.isConfirmed) {
        this.procesarCierreDeTicket(
            ticketSeleccionado.id, 
            resultadoModal.value.resolucion,
            resultadoModal.value.firma,
            resultadoModal.value.archivo
        );
      }
    });
  }

procesarCierreDeTicket(idTicket: number, resolucionTexto: string, firmaBase64: string, archivoAdjunto?: File) {
    const formularioDatos = new FormData();
    formularioDatos.append('id', idTicket.toString());
    formularioDatos.append('estado', 'Completo');
    formularioDatos.append('descripcion_resolucion', resolucionTexto);
    formularioDatos.append('firma', firmaBase64); 
    
    if (this.usuarioActual && this.usuarioActual.id) {
        formularioDatos.append('usuario_id', this.usuarioActual.id.toString());
    }
    
    if (archivoAdjunto) {
      formularioDatos.append('evidencia', archivoAdjunto);
    }

    this.apiService.actualizarEstadoTicketConEvidencia(formularioDatos).subscribe({
      next: (respuestaServidor: any) => {
        if (respuestaServidor.status === true) {
          this.usuarioActual.estado_disponibilidad = 'disponible';
          localStorage.setItem('usuario_actual', JSON.stringify(this.usuarioActual));

          Swal.fire({ 
              icon: 'success', 
              title: 'Ticket cerrado correctamente', 
              text: 'Tu estado ha cambiado a Disponible 🟢',
              timer: 2000, 
              showConfirmButton: false 
          });
          this.obtenerTicketsPendientes(); 
        } else {
          Swal.fire('Error', respuestaServidor.message || 'No se pudo actualizar el estado del ticket', 'error');
        }
      },
      error: (err) => Swal.fire('Error de conexión', 'No se pudo conectar con el servidor', 'error')
    });
  }
}