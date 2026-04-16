import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2'; 
import { Subscription, interval } from 'rxjs';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-personal-pending',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './personal-pending.html',
  styleUrls: ['./personal-pending.css'] 
})
export class PersonalPendingComponent implements OnInit, OnDestroy {

  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private pollingSubscription: Subscription | undefined;

  usuarioActual: any = {};
  listaTicketsPendientes: any[] = []; 
  cargandoDatos = true;
  fechaReferenciaActual = new Date(); 
  listaTicketsIncompletos: any[] = [];

  ngOnInit() {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      this.usuarioActual = JSON.parse(usuarioGuardado);
      this.obtenerTicketsPendientes();

      this.pollingSubscription = interval(15000).subscribe(() => {
          this.ejecutarLlamadaApi(true);
      });

      this.mostrarNovedades();
    }
  }

  ngOnDestroy() {
      if (this.pollingSubscription) {
          this.pollingSubscription.unsubscribe();
      }
  }

  obtenerTicketsPendientes() {
    this.cargandoDatos = true;
    this.ejecutarLlamadaApi(false);
  }

private ejecutarLlamadaApi(esSilencioso: boolean) {
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

        const fechaActual = new Date();
        const mesActual = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
        
        this.listaTicketsIncompletos = todosLosTickets.filter((ticket: any) =>
            ticket.estado === 'Incompleto' &&
            ticket.fecha && ticket.fecha.startsWith(mesActual)
        );

        const idsNuevos = nuevaListaTickets.map(t => t.id);
        const hayTicketsNuevos = idsNuevos.some(id => !idsAntiguos.includes(id));

        this.listaTicketsPendientes = nuevaListaTickets;
        this.cargandoDatos = false;
        this.cdr.detectChanges();

        if (hayTicketsNuevos && idsAntiguos.length > 0) {
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
            });
            Toast.fire({ icon: 'info', iconColor: '#56212f', title: '¡Tienes nuevos reportes asignados!' });
        }

        if (!esSilencioso && this.listaTicketsIncompletos.length > 0) {
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 5000, timerProgressBar: true
            });
            Toast.fire({ 
                icon: 'warning', 
                iconColor: '#e74c3c',
                title: `Tienes ${this.listaTicketsIncompletos.length} ticket${this.listaTicketsIncompletos.length > 1 ? 's' : ''} incompleto${this.listaTicketsIncompletos.length > 1 ? 's' : ''} este mes`
            });
        }
      },
      error: () => {
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
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticketSeleccionado.nombre_usuario} ${ticketSeleccionado.apellido_usuario || ''}</p>          </div>
          <div>
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ext / Teléfono</p>
            <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticketSeleccionado.extension_tel || '-'}</p>
          </div>
        </div>

        <div style="display: flex; gap: 40px; margin-bottom: 25px;">
          <div style="flex: 1;">
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Departamento</p>
            <p style="margin: 4px 0 0 0; font-weight: 500; font-size: 1.05rem; color: #334155;">${ticketSeleccionado.departamento}</p>
          </div>
          <div style="flex: 1;">
            <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Municipio</p>
            <p style="margin: 4px 0 0 0; font-weight: 500; font-size: 1.05rem; color: #334155;">${ticketSeleccionado.municipio || '-'}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="margin: 0; font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Vía de Atención</p>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
            <span class="material-symbols-outlined" style="font-size: 1.3rem; color: ${ticketSeleccionado.metodo_resolucion === 'Presencial' ? '#16a085' : (ticketSeleccionado.metodo_resolucion === 'Llamada / Remoto' ? '#2980b9' : '#94a3b8')};">
              ${ticketSeleccionado.metodo_resolucion === 'Presencial' ? 'engineering' : (ticketSeleccionado.metodo_resolucion === 'Llamada / Remoto' ? 'support_agent' : 'help_outline')}
            </span>
            <span style="font-weight: 700; font-size: 1rem; color: #334155;">
              ${ticketSeleccionado.metodo_resolucion || 'No especificada por la asignadora'}
            </span>
          </div>
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
  let resizeCanvas: () => void;
 let archivoEvidencia: File | null = null;

  Swal.fire({
    title: `Finalizar Ticket #${ticketSeleccionado.id}`,
    grow: window.innerWidth < 600 ? 'column' : false,
    html: `
      <div style="text-align: left;">
        <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 8px;">Documenta la solución y solicita la firma.</p>
        
        <label style="font-weight: 800; color: #56212f; font-size: 0.9rem;">Resolución (Obligatorio):</label>
        <textarea id="solucion-text" class="swal2-textarea" style=" text-transform: uppercase; margin: 5px 0 10px 0; width: 100%; height: 60px; box-sizing: border-box; font-size: 0.9rem; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1;" placeholder="Descripción..."></textarea>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px;">
          <label style="font-weight: 800; color: #56212f; font-size: 0.9rem; margin: 0;">Firma del Solicitante:</label>
          <button type="button" id="btn-limpiar-firma" style="background: none; border: none; color: #b45309; text-decoration: underline; cursor: pointer; font-size: 0.8rem; font-weight: bold; padding: 0;">Limpiar</button>
        </div>

        <label style="display: flex; align-items: center; gap: 10px; background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 12px; border-radius: 6px; cursor: pointer; margin-bottom: 8px; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
          <input type="checkbox" id="sin-firma" style="width: 18px; height: 18px; cursor: pointer; accent-color: #56212f; margin: 0;">
          <span style="font-size: 0.85rem; color: #334155; font-weight: 700; user-select: none;">Cerrar ticket sin firma (Ausencia del solicitante)</span>
        </label>

        <div id="contenedor-firma" style="border: 2px dashed #cbd5e1; border-radius: 8px; background: #fff; touch-action: none; position: relative;">
          <canvas id="firma-canvas" style="width: 100%; height: 220px; cursor: crosshair; display: block;"></canvas>
          
          <div id="overlay-abrir-firma" style="
            display: none;
            position: absolute; inset: 0;
            background: rgba(86,33,47,0.06);
            border-radius: 8px;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 8px;
            cursor: pointer;
          ">
            <span class="material-symbols-outlined" style=" color: #56212f; font-size: 2rem;">stylus_note</span>
            <span style="font-weight: 800; color: #56212f; font-size: 0.95rem;">Toca para firmar</span>
            <span style="font-size: 0.75rem; color: #64748b;">Se abrirá en pantalla completa</span>
          </div>
        </div>

        <div id="firma-preview-container" style="display: none; margin-top: 6px;">
            <img id="firma-preview-img" style="width: 100%; border-radius: 8px; border: 1px solid #cbd5e1; max-height: 80px; object-fit: contain; background: #fff;">
            
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 10px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
              <span class="material-symbols-outlined" style="font-size: 1.2rem; color: #16a085;">check_circle</span>
              <p style="font-size: 0.75rem; font-weight: 700; color: #16a085; margin: 0;">Firma capturada correctamente</p>
            </div>

          </div>

        <div id="firma-fullscreen-overlay" style="
          display: none;
          position: fixed; inset: 0;
          background: #fff;
          z-index: 99999;
          flex-direction: column;
        ">
          <div style="background: #56212f; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
            <span  style="color: #fff; font-weight: 600; font-size: 1rem;"><span class="material-symbols-outlined">stylus_note</span>Firma del Solicitante</span>
            <div style="display: flex; gap: 8px;">
              <button id="btn-limpiar-fullscreen" type="button" style="background: rgba(255,255,255,0.15); border: none; color: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Limpiar</button>
              <button id="btn-cancelar-fullscreen" type="button" style="background: rgba(255,255,255,0.15); border: none; color: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Cancelar</button>
              <button id="btn-confirmar-fullscreen" type="button" style="background: #c3b08f; border: none; color: #56212f; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 800; font-size: 0.9rem;">Confirmar ✓</button>
            </div>
          </div>
          <div style="flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 6px; min-height: 0; overflow: hidden;">
            <p style="color: #64748b; font-size: 0.8rem; margin: 0; text-align: center; flex-shrink: 0;">Firme en el área de abajo</p>
            <canvas id="firma-canvas-fullscreen" style="flex: 1; width: 100%; border: 2px dashed #cbd5e1; border-radius: 8px; cursor: crosshair; touch-action: none; display: block; min-height: 0;"></canvas>
          </div>
        </div>

          <label style="font-weight: 800; color: #56212f; font-size: 0.9rem; display: block; margin-top: 15px;"> Evidencia Fotográfica (Obligatorio): </label>

          <input type="file" id="camera-input" accept="image/*" capture="environment" style="display: none;">
          <input type="file" id="gallery-input" accept="image/*" style="display: none;">

          <button type="button" id="btn-camera"
            onclick="document.getElementById('camera-input').click()"
            style="margin-top: 8px; padding: 8px; border-radius: 8px; color: black; background: #f1f5f9; border: 1px solid #ccc; width: 100%; font-weight: 600;">
            <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.4rem;">add_a_photo</span>
            Tomar foto
          </button>

          <button type="button" id="btn-gallery"
            onclick="document.getElementById('gallery-input').click()"
            style="margin-top: 5px; padding: 8px; border-radius: 8px; color: black; background: #f1f5f9; border: 1px solid #ccc; width: 100%; font-weight: 600;">
            <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.4rem;">add_photo_alternate</span>
            Elegir en galería
          </button>

          <div id="badge-foto" style="
            display: none;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            padding: 10px 12px;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
          ">
          </div>
                        </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    confirmButtonColor: '#56212f',
    cancelButtonText: 'Cancelar',
    cancelButtonColor: '#000000',
    width: '650px',

    didOpen: () => {
      canvas = document.getElementById('firma-canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d');
        const contenedor = document.getElementById('contenedor-firma');

        const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
        const btnCamera = document.getElementById('btn-camera') as HTMLElement;
        const btnGallery = document.getElementById('btn-gallery') as HTMLElement;
        if (!esMovil && btnCamera) {
          btnCamera.style.display = 'none';
        }

        if (btnCamera) {
          btnCamera.style.background = '#f1f5f9';
          btnCamera.style.color = '#000000';
          btnCamera.style.border = '1px solid #ccc';
          btnCamera.style.width = '100%';
          btnCamera.style.fontWeight = '600';
        }

        if (btnGallery) {
          btnGallery.style.background = '#f1f5f9';
          btnCamera.style.color = '#000000';
          btnGallery.style.border = '1px solid #ccc';
          btnGallery.style.width = '100%';
          btnGallery.style.fontWeight = '600';
        }

const cameraInput = document.getElementById('camera-input') as HTMLInputElement;
const galleryInput = document.getElementById('gallery-input') as HTMLInputElement;

const manejarArchivo = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    archivoEvidencia = file; 

    const btnCamera = document.getElementById('btn-camera') as HTMLElement;
    const btnGallery = document.getElementById('btn-gallery') as HTMLElement;
    const badge = document.getElementById('badge-foto') as HTMLElement;

    if (btnCamera) { btnCamera.style.borderColor = '#16a085'; btnCamera.style.color = '#16a085'; }
    if (btnGallery) { btnGallery.style.borderColor = '#16a085'; btnGallery.style.color = '#16a085'; }
    if (badge) {
      badge.style.display = 'flex';
      badge.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 1rem; color: #16a085;">check_circle</span>
        <span style="font-size: 0.8rem; font-weight: 700; color: #16a085;">${file.name}</span>
        <button type="button" id="btn-quitar-foto" style="background:none; border:none; cursor:pointer; padding:0; margin-left:auto;">
          <span class="material-symbols-outlined" style="font-size: 1rem; color: #94a3b8;">close</span>
        </button>
      `;
      document.getElementById('btn-quitar-foto')?.addEventListener('click', () => {
        archivoEvidencia = null;
        cameraInput.value = '';
        galleryInput.value = '';
        badge.style.display = 'none';
        if (btnCamera) { btnCamera.style.borderColor = '#ccc'; btnCamera.style.color = '#000'; }
        if (btnGallery) { btnGallery.style.borderColor = '#ccc'; btnGallery.style.color = '#000'; }
      });
    }
  }
};

cameraInput?.addEventListener('change', manejarArchivo);
galleryInput?.addEventListener('change', manejarArchivo);

      resizeCanvas = () => {
        const rect = contenedor!.getBoundingClientRect();
        const tempImg = canvas.toDataURL();
        canvas.width = rect.width;
        canvas.height = rect.height;
        if (!isEmpty && ctx) {
          const img = new Image();
          img.onload = () => ctx?.drawImage(img, 0, 0);
          img.src = tempImg;
        }
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const getPos = (evt: any) => {
        const r = canvas.getBoundingClientRect();
        const clientX = evt.clientX ?? evt.touches?.[0]?.clientX ?? 0;
        const clientY = evt.clientY ?? evt.touches?.[0]?.clientY ?? 0;
        return { x: clientX - r.left, y: clientY - r.top };
      };

      const startDrawing = (e: any) => {
        if (e.type === 'touchstart') e.preventDefault();
        isDrawing = true; isEmpty = false;
        const pos = getPos(e);
        ctx?.beginPath(); ctx?.moveTo(pos.x, pos.y);
      };
      const draw = (e: any) => {
        if (e.type === 'touchmove') e.preventDefault();
        if (!isDrawing || !ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.stroke();
      };
      const stopDrawing = () => { isDrawing = false; ctx?.closePath(); };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);

      document.getElementById('btn-limpiar-firma')?.addEventListener('click', () => {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        isEmpty = true;
      });

      const checkboxSinFirma = document.getElementById('sin-firma') as HTMLInputElement;
      checkboxSinFirma?.addEventListener('change', () => {
        if (checkboxSinFirma.checked) {
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          isEmpty = true;
          canvas.style.pointerEvents = 'none';
          canvas.style.opacity = '0.4';
          const ov = document.getElementById('overlay-abrir-firma');
          if (ov) ov.style.display = 'none';
        } else {
          canvas.style.pointerEvents = 'auto';
          canvas.style.opacity = '1';
          if (window.innerWidth < 768) {
            const ov = document.getElementById('overlay-abrir-firma');
            if (ov) ov.style.display = 'flex';
          }
        }
      });


     if (window.innerWidth < 900 || 'ontouchstart' in window) {
        const overlayAbrirFirma = document.getElementById('overlay-abrir-firma')!;
        const firmaFullscreen = document.getElementById('firma-fullscreen-overlay')!;
        const canvasFS = document.getElementById('firma-canvas-fullscreen') as HTMLCanvasElement;
        const ctxFS = canvasFS?.getContext('2d');
        const previewContainer = document.getElementById('firma-preview-container')!;
        const previewImg = document.getElementById('firma-preview-img') as HTMLImageElement;
        let isDrawingFS = false;
        let isEmptyFS = true;

        overlayAbrirFirma.style.display = 'flex';
        canvas.style.pointerEvents = 'none';

        document.body.appendChild(firmaFullscreen);

        const abrirFullscreen = () => {
          const cbSinFirma = document.getElementById('sin-firma') as HTMLInputElement;
          if (cbSinFirma?.checked) return;

          firmaFullscreen.style.display = 'flex';
          document.body.style.overflow = 'hidden';

          setTimeout(() => {
            const rect = canvasFS.getBoundingClientRect();
            canvasFS.width = rect.width;
            canvasFS.height = rect.height;

            if (!isEmpty) {
              const dataUrl = canvas.toDataURL();
              const img = new Image();
              img.onload = () => ctxFS?.drawImage(img, 0, 0, canvasFS.width, canvasFS.height);
              img.src = dataUrl;
              isEmptyFS = false;
            }
          }, 50);
        };

        overlayAbrirFirma.addEventListener('click', abrirFullscreen);

        const getPosFS = (evt: any) => {
          const r = canvasFS.getBoundingClientRect();
          const clientX = evt.clientX ?? evt.touches?.[0]?.clientX ?? 0;
          const clientY = evt.clientY ?? evt.touches?.[0]?.clientY ?? 0;
          return { x: clientX - r.left, y: clientY - r.top };
        };

        const startFS = (e: any) => {
          if (e.type === 'touchstart') e.preventDefault();
          isDrawingFS = true; isEmptyFS = false;
          const p = getPosFS(e);
          ctxFS?.beginPath(); ctxFS?.moveTo(p.x, p.y);
        };
        const drawFS = (e: any) => {
          if (e.type === 'touchmove') e.preventDefault();
          if (!isDrawingFS || !ctxFS) return;
          const p = getPosFS(e);
          ctxFS.lineTo(p.x, p.y);
          ctxFS.strokeStyle = '#000'; ctxFS.lineWidth = 3; ctxFS.lineCap = 'round';
          ctxFS.stroke();
        };
        const stopFS = () => { isDrawingFS = false; ctxFS?.closePath(); };

        canvasFS.addEventListener('mousedown', startFS);
        canvasFS.addEventListener('mousemove', drawFS);
        canvasFS.addEventListener('mouseup', stopFS);
        canvasFS.addEventListener('touchstart', startFS, { passive: false });
        canvasFS.addEventListener('touchmove', drawFS, { passive: false });
        canvasFS.addEventListener('touchend', stopFS);

        document.getElementById('btn-limpiar-fullscreen')?.addEventListener('click', () => {
          ctxFS?.clearRect(0, 0, canvasFS.width, canvasFS.height);
          isEmptyFS = true;
        });

        document.getElementById('btn-cancelar-fullscreen')?.addEventListener('click', () => {
          firmaFullscreen.style.display = 'none';
          document.body.style.overflow = '';
        });

        document.getElementById('btn-confirmar-fullscreen')?.addEventListener('click', () => {
          if (!isEmptyFS) {
            const dataUrl = canvasFS.toDataURL();

            const img = new Image();
            img.onload = () => {
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              isEmpty = false;
            };
            img.src = dataUrl;

            previewImg.src = dataUrl;
            previewContainer.style.display = 'block';

            overlayAbrirFirma.innerHTML = `
              <span style="font-weight: 800; color: #27ae60; font-size: 0.9rem;">Firma capturada</span>
              <span style="font-size: 0.75rem; color: #64748b;">Toca para volver a firmar</span>
            `;
            overlayAbrirFirma.addEventListener('click', abrirFullscreen);
          }

          firmaFullscreen.style.display = 'none';
          document.body.style.overflow = '';
        });
      }

    const input = document.getElementById('solucion-text') as HTMLTextAreaElement;
    if (input) {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase();
    });
  }
    },

    willClose: () => {
      document.getElementById('firma-fullscreen-overlay')?.remove();
      document.body.style.overflow = '';
      window.removeEventListener('resize', resizeCanvas);
    },

    preConfirm: async () => {
  const descripcionResolucion =
    (document.getElementById('solucion-text') as HTMLTextAreaElement).value;
  const archivoEvidenciaOriginal = archivoEvidencia;
  const sinFirma =
    (document.getElementById('sin-firma') as HTMLInputElement)?.checked;

  if (!descripcionResolucion || descripcionResolucion.trim() === '') {
    Swal.showValidationMessage('Debes escribir la resolución.');
    return false;
  }

  if (!archivoEvidenciaOriginal) {
    Swal.showValidationMessage('Es obligatorio adjuntar una foto de evidencia para cerrar el ticket.');
    return false;
  }

  if (!sinFirma && isEmpty) {
    Swal.showValidationMessage('El usuario debe firmar o marcar "Cerrar sin firma".');
    return false;
  }

  if (archivoEvidenciaOriginal && archivoEvidenciaOriginal.size > 15_000_000) {
    Swal.showValidationMessage('La imagen es demasiado grande (máx 15MB original).');
    return false;
  }

  try {
    let base64Evidencia = null;

    if (archivoEvidenciaOriginal) {
      Swal.showLoading();

      const opciones: any = {
        maxSizeMB: 0.3,          
        maxWidthOrHeight: 1280,  
        useWebWorker: true,
        initialQuality: 0.75,     
        fileType: 'image/jpeg',  
      };

      const compressed = await imageCompression(archivoEvidenciaOriginal, opciones);
      base64Evidencia = await imageCompression.getDataUrlFromFile(compressed);

      if (base64Evidencia.length > 6_000_000) {
        Swal.showValidationMessage('No se pudo comprimir la imagen lo suficiente, intenta con otra foto.');
        return false;
      }
    }

    let firmaFinal = null;
    if (!sinFirma) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
      }
      firmaFinal = tempCanvas.toDataURL('image/jpeg', 0.7);
    }

    return { resolucion: descripcionResolucion, archivo: base64Evidencia, firma: firmaFinal };

  } catch (error) {
    Swal.showValidationMessage('Error al procesar la foto.');
    return false;
  }
}

  }).then((resultadoModal) => {
    if (resultadoModal.isConfirmed && resultadoModal.value) {
      this.procesarCierreDeTicket(
        ticketSeleccionado.id,
        resultadoModal.value.resolucion,
        resultadoModal.value.firma,
        resultadoModal.value.archivo
      );
    }
  });
}
procesarCierreDeTicket(
  idTicket: number,
  resolucionTexto: string,
  firmaBase64: string,
  archivoAdjuntoBase64?: string
) {

  Swal.fire({
    title: 'Guardando datos...',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  const payloadEnvio = {
    id: idTicket,
    estado: 'Completo',
    descripcion_resolucion: resolucionTexto,
    firma: firmaBase64,
    usuario_id: this.usuarioActual?.id || null,
    evidencia: archivoAdjuntoBase64 || null
  };
    this.apiService.actualizarEstadoTicketConEvidencia(payloadEnvio).subscribe({
      next: (res: any) => {
        if (res.status === true) {
          this.usuarioActual.estado_disponibilidad = 'disponible';
          localStorage.setItem(
            'usuario_actual',
            JSON.stringify(this.usuarioActual)
          );
          Swal.fire({
            icon: 'success',
            title: 'Ticket cerrado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.obtenerTicketsPendientes();
        } else {
          Swal.fire('Error', res.message || 'Error al actualizar', 'error');
        }
      },
      error: (err) => {
        console.error("Error servidor:", err);
        Swal.fire(
          'Error de conexión',
          'No se pudo conectar con el servidor',
          'error'
        );
      }
    });
  }

abrirModalTicketIncompleto(ticketSeleccionado: any) {
    let detallesExtraHtml = '';
    let colorFondoCategoria = '#64748b';

    if (ticketSeleccionado.descripcion === 'Internet') colorFondoCategoria = '#2980b9';
    else if (ticketSeleccionado.descripcion === 'Office') colorFondoCategoria = '#d35400';
    else if (ticketSeleccionado.descripcion === 'Telefonia') colorFondoCategoria = '#2c3e50';
    else if (ticketSeleccionado.descripcion === 'Extension/Telefono') colorFondoCategoria = '#94961c';
    else if (ticketSeleccionado.descripcion === 'Dictaminar') {
        colorFondoCategoria = '#6c5ce7';
        if (ticketSeleccionado.cantidad_dicta) {
            detallesExtraHtml = `<span style="color:#cbd5e1;margin:0 10px;">|</span><span style="font-size:0.95rem;font-weight:800;color:${colorFondoCategoria};">Equipos: ${ticketSeleccionado.cantidad_dicta}</span>`;
        }
    }
    else if (ticketSeleccionado.descripcion === 'Correo') {
        colorFondoCategoria = '#96241c';
        if (ticketSeleccionado.correo_tipo) {
            detallesExtraHtml = `<span style="color:#cbd5e1;margin:0 10px;">|</span><span style="font-size:0.95rem;font-weight:800;color:${colorFondoCategoria};">Dominio: ${ticketSeleccionado.correo_tipo}</span>`;
        }
    }
    else if (ticketSeleccionado.descripcion === 'Tecnico') {
        colorFondoCategoria = '#16a085';
        if (ticketSeleccionado.soporte_tipo) {
            detallesExtraHtml = `<span style="color:#cbd5e1;margin:0 10px;">|</span><span style="font-size:0.95rem;font-weight:800;color:${colorFondoCategoria};">Soporte: ${ticketSeleccionado.soporte_tipo}</span>`;
        }
    }

    let colorPrioridad = '#64748b';
    if (ticketSeleccionado.prioridad === 'Alta') colorPrioridad = '#c0392b';
    else if (ticketSeleccionado.prioridad === 'Media') colorPrioridad = '#f39c12';
    else if (ticketSeleccionado.prioridad === 'Baja') colorPrioridad = '#27ae60';

    Swal.fire({
        html: `
        <div style="text-align:left;font-family:'Segoe UI',sans-serif;color:#1e293b;">
            
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                <span style="background:#fee2e2;color:#e74c3c;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">INCOMPLETO</span>
            </div>

            <h1 style="font-size:2.2rem;font-weight:900;margin:0 0 20px 0;color:#0f172a;font-style:italic;">Ticket: #${ticketSeleccionado.id}</h1>

            <div style="display:flex;gap:40px;margin-bottom:25px;">
                <div>
                    <p style="margin:0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Fecha de Solicitud</p>
                    <p style="margin:4px 0 0 0;font-size:0.95rem;font-weight:600;color:#334155;">${ticketSeleccionado.fecha || 'N/A'}</p>
                </div>
                <div>
                    <p style="margin:0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Venció</p>
                    <p style="margin:4px 0 0 0;font-size:0.95rem;font-weight:600;color:#e74c3c;">${ticketSeleccionado.fecha_limite || 'N/A'}</p>
                </div>
            </div>

            <hr style="border:0;border-top:1px solid #f1f5f9;margin:20px 0;">

            <div style="display:flex;gap:40px;margin-bottom:25px;">
                <div>
                    <p style="margin:0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Solicitante</p>
                    <p style="margin: 4px 0 0 0; font-weight: 800; font-size: 1.1rem; color: #0f172a;">${ticketSeleccionado.nombre_usuario} ${ticketSeleccionado.apellido_usuario || ''}</p>
                </div>
                <div>
                    <p style="margin:0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Ext / Teléfono</p>
                    <p style="margin:4px 0 0 0;font-weight:800;font-size:1.1rem;color:#0f172a;">${ticketSeleccionado.extension_tel || '-'}</p>
                </div>
            </div>

            <div style="display:flex;gap:40px;margin-bottom:25px;">
                <div style="flex:1;">
                    <p style="margin:0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Departamento</p>
                    <p style="margin:4px 0 0 0;font-weight:500;font-size:1.05rem;color:#334155;">${ticketSeleccionado.departamento}</p>
                </div>
                <div style="flex:1;">
                    <p style="margin:0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Municipio</p>
                    <p style="margin:4px 0 0 0;font-weight:500;font-size:1.05rem;color:#334155;">${ticketSeleccionado.municipio || '-'}</p>
                </div>
            </div>

            <div style="margin-bottom:30px;">
                <p style="margin:0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Vía de Atención</p>
                <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
                    <span class="material-symbols-outlined" style="font-size:1.3rem;color:${ticketSeleccionado.metodo_resolucion === 'Presencial' ? '#16a085' : (ticketSeleccionado.metodo_resolucion === 'Llamada / Remoto' ? '#2980b9' : '#94a3b8')};">
                        ${ticketSeleccionado.metodo_resolucion === 'Presencial' ? 'engineering' : (ticketSeleccionado.metodo_resolucion === 'Llamada / Remoto' ? 'support_agent' : 'help_outline')}
                    </span>
                    <span style="font-weight:700;font-size:1rem;color:#334155;">${ticketSeleccionado.metodo_resolucion || 'No especificada'}</span>
                </div>
            </div>

            <p style="margin:0 0 8px 0;font-size:0.75rem;color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">Clasificación del Problema</p>

            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;border:1px solid #e2e8f0;border-left:6px solid ${colorFondoCategoria};border-radius:8px;padding:15px;margin-bottom:30px;gap:10px;">
                <div style="display:flex;align-items:center;flex-wrap:wrap;">
                    <span style="background-color:${colorFondoCategoria};color:white;padding:4px 12px;border-radius:4px;font-size:0.85rem;font-weight:700;">${ticketSeleccionado.descripcion}</span>
                    ${detallesExtraHtml}
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <p style="margin:0;color:#64748b;font-size:0.85rem;font-weight:700;">Prio:</p>
                    <span style="background-color:${colorPrioridad};color:white;padding:4px 10px;border-radius:4px;font-size:0.8rem;font-weight:700;">${ticketSeleccionado.prioridad}</span>
                </div>
            </div>

            <div>
                <p style="margin:0 0 8px 0;font-size:0.75rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Notas Adicionales</p>
                <div style="background-color:#f8fafc;border:1px solid #f1f5f9;border-radius:8px;padding:15px;">
                    <p style="margin:0;font-size:0.95rem;color:#475569;line-height:1.5;">
                        ${ticketSeleccionado.notas ? ticketSeleccionado.notas : '<em style="color:#cbd5e1;">Sin notas adicionales.</em>'}
                    </p>
                </div>
            </div>

        </div>`,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: '<span class="material-symbols-outlined" style="vertical-align:middle;font-size:1.1rem;margin-right:5px;">check_circle</span> Completar con retraso',
        confirmButtonColor: '#b45309',
        cancelButtonText: 'Cerrar',
        cancelButtonColor: '#000000'
    }).then((result) => {
        if (result.isConfirmed) {
            this.abrirModalFinalizacion(ticketSeleccionado);
        }
    });
}



  mostrarNovedades() {
  const claveVista = 'novedad_firma_v4';

  if (localStorage.getItem(claveVista)) return; 

  Swal.fire({
    title: '',
html: `
<div style="text-align: left; font-family: 'Segoe UI', sans-serif; padding: 4px 0;">

  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
    <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.4rem;">new_releases</span>
    <div>
      <p style="margin: 0; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Actualización</p>
      <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a;">Mejoras en móvil y  botones para evidencia.</h3>
    </div>
  </div>

  <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: #64748b; line-height: 1.5; padding-left: 2px;">
    Dos mejoras nuevas: una <strong style="color: #1e293b;">vista nueva</strong> de tickets en móvil y la opción de <strong style="color: #1e293b;">adjuntar evidencia mediante dos botones</strong> al cerrar un ticket.
  </p>

  <div style="display: flex; flex-direction: column; gap: 1px; border-radius: 10px; overflow: hidden; border: 1px solid #f1f5f9; margin-bottom: 16px;">

    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
      <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">view_agenda</span>
      <div>
        <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Nueva vista de tickets en móvil</p>
        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
          Los tickets ahora se muestran en <strong style="color: #1e293b;">tarjetas</strong> en lugar de tabla, con toda la información visible sin necesidad de hacer scroll.
        </p>
      </div>
    </div>

    <div style="height: 1px; background: #f1f5f9;"></div>

    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
      <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">smartphone</span>
      <div>
        <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Evidencia en móvil</p>
        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
          Aparecen dos botones: <strong style="color: #1e293b;">Tomar foto</strong> para usar la cámara en ese momento, o <strong style="color: #1e293b;">Elegir en galería</strong> para adjuntar una imagen en galería.
        </p>
      </div>
    </div>

    <div style="height: 1px; background: #f1f5f9;"></div>

    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
      <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">computer</span>
      <div>
        <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Evidencia en PC</p>
        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
          Solo aparece el botón <strong style="color: #1e293b;">Elegir en galería</strong> para seleccionar una imagen desde tu equipo.
        </p>
      </div>
    </div>

  </div>

  <div style="display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: rgba(86,33,47,0.04); border-radius: 8px; border-left: 2px solid #56212f;">
    <span class="material-symbols-outlined" style="color: #56212f; font-size: 1rem; flex-shrink: 0; margin-top: 1px;">info</span>
    <p style="margin: 0; font-size: 0.78rem; color: #56212f; line-height: 1.5;">
      La evidencia fotográfica es <strong>opcional</strong>. En PC la vista de tickets permanece igual que antes.
    </p>
  </div>

</div>
`,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#56212f',
    width: window.innerWidth < 600 ? '92vw' : '480px',
    showClass: {
      popup: 'animate__animated animate__fadeInDown'
    }
  }).then(() => {
    localStorage.setItem(claveVista, 'true');
  });
}
}