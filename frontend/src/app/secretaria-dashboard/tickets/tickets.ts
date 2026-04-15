import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs'; 
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html', 
  styleUrl: './tickets.css' 
})
export class TicketsComponent implements OnInit, OnDestroy { 
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
private route = inject(ActivatedRoute);

  listaTecnicos: any[] = [];
  reportesDelDia: any[] = []; 
  fechaSistema = new Date();
  mostrarSugerencias = false;
  
  private pollingTecnicos: Subscription | undefined;
  
  listaDepartamentosBase: string[] = [
  "Consejo Directivo",
  "Secretaría Técnica de la Junta de Gobierno de Edu. S y Edu. C", 
  "Dirección General",

   "Área de Auditoría",
   "Área de Quejas",
   "Área de Responsabilidades",

    "Órgano Interno de Control", 
    "Unidad de Modernización para la Calidad del Servicio", 
    "Unidad de Comunicación Social",
    "Depto. de Estudios y Proyectos para el Desarrollo Institucional",
    "Depto. de Sistemas Administrativos", 
    "Centro de Información y Documentación",

    "Unidad de Asuntos Jurídicos e Igualdad de Género", 
    "Depto. Jurídico Contencioso", 
    "Depto. de Legislación y Consulta", 
    "Depto. de Asuntos Relacionados con los Derechos Humanos", 
    "Depto. Jurídico Valle de México",

    "Unidad del  Sistema para la Carrera de las Maestras y Maestros",
    "Depto. de Admisión y Promoción Vertical", 
    "Depto. de Reconocimiento", 
    "Depto. de Promoción en el Servicio",

    "Direcc. de Educación Elemental", 
    "Subdirec de Educación Elemental", 
    "Depto. de Computación Electrónica en la Educación Elemental",
    
    "Subdirec. de Educación Primaria Región Toluca", 
    "Subdirec. de Educación Primaria Región Atlacomulco",
    "Subdirec. de Educación Primaria Región Naucalpan",
    "Subdirec. de Educación Primaria Región Ecatepec",
    "Subdirec. de Educación Primaria Región Nezahualcóyotl",

    "Depto. de Educación Inicial No Escolarizada", 
    "Depto. de Educación Indígena",
    "Depto. de Educación para Adultos",
    "Depto. para el Desarrollo de la Calidad Educativa", 
    "Depto. de Educación Especial Valle de Toluca",
    "Depto. de Educación Especial Valle de México", 
    "Depto. de Educación Preescolar del Valle de Toluca", 
    "Depto. de Educación Preescolar del Valle de México",

    "Coordinación Académica y de Operación Educativa",
    "Direcc. de Educación Secundaria y Servicios de Apoyo",
    "Subdirec. de Educación Secundaria ",
    "Depto. de Educación Secundaria General Valle de Toluca", 
    "Depto. de Educación Secundaria Técnica Valle de Toluca",
    "Depto. de Telesecundaria Valle de Toluca",
    "Depto. de Educación Secundaria General Valle de México",
    "Depto. de Educación Secundaria Técnica Vallea México",
    "Depto. de Telesecundaria Valle México",

    "Depto. de Extensión y Vinculación Educativa Valle de Toluca",
    "Depto. de Computación Electronica en la Educación Secundaria",
    "Depto. de Extensión y Vinculación Educativa Valle de México",
    "Depto. de Educación Física del Valle de Toluca",
    "Depto. de Educación Física del Valle de México", 

    "Direcc. de Preparatoria Abierta", 
    "Depto. de Preparatoria Abierta Valle de Toluca",
    "Depto. de Preparatoria Abierta Valle de México",

    "Direcc. de Educación Superior",
    "Depto. de Formación Profesional",
    "Depto. de Posgrado e Investigación",
    "Depto. de Actualización",

    "Direcc. de  Servicios Regionalizados",
    "Depto. de Apoyo Técnico", 
    "Depto. de Administración de Personal", 
    "Depto. de Recursos Materiales y Financieros",
    "Subdirec. de Servicios Regionales Naucalpan",
    "Subdirec. de Servicios Regionales Ecatepec", 
    "Subdirec. de Servicios Regionales Nezahualcóyotl",

  "Coordinación de Administración y Finanzas",
  "Direcc. de Administración y Desarrollo de Personal",
  "Subdirec. de Desarrollo de Personal", 
  "Depto. de Capacitación y Desarrollo",
   "Depto. de Prestaciones", 
   "Depto. de Asuntos Laborales", 

   "Subdirec. de Administración de Personal", 
   "Depto. de Trámite y Control de Personal",
    "Depto. de Control y Calidad de Pago", 
    "Depto. de Registro y Archivo",
   
  "Direcc. de Recursos Materiales y Financieros", 
  "Subdirec. de Recursos Materiales y Servicios", 
  "Depto. de Adquisiciones", 
  "Depto. de Servicios Generales",
  "Depto. de Almacén",
  "Depto. de Inventarios",

  "Subdirec. de Finanzas",
  "Depto. de Programación y Presupuesto", 
  "Depto. de Contabilidad",
  "Depto. de Tesorería", 

    "Subdirec. de Distribución de Cheques", 
    "Pagaduría Valle de Toluca", 
    "Pagaduría Valle de México",

    "Direcc. de Planeación y Evaluación",
    "Depto. de Planeación y Programación",
    "Depto. de Estadística", 
    "Depto. de Control Escolar",
    "Depto. de Evaluación Institucional", 

    "Direcc. de Instalaciones Educativas",
    "Depto. de Espacios Escolares", 
    "Depto. de Equipamiento Escolar", 
    "Depto. de Preservación de Instalaciones",

    "Direcc. de Informática y Telecomunicaciones",
    "Depto. Técnico",
    "Depto. de Desarrollo de Sistemas",
    "Depto. de Producción",
    "Oficina de Escuelas Particulares",
  ];

  departamentosSugeridos: string[] = [...this.listaDepartamentosBase];

  nuevoTicket: any = { 
    nombre_usuario: '', 
    apellido_usuario: '',
    departamento: '',
    municipio: '',
    personalId: '',     
    descripcion: '',    
    prioridad: '',
    metodo_resolucion: '',
    notas: '',
    cantidad_dicta: null,
    extension_tel: '',
    correo_tipo: '',
    soporte: {
      impresora: false,
      escaner: false,
      software: false,
      hardware: false,
      garantias: false,
    }
  };

  ngOnInit() {
    this.obtenerTecnicos();
    this.obtenerReportesDelDia();

    this.pollingTecnicos = interval(15000).subscribe(() => {
        this.obtenerTecnicos();
    });


    this.route.queryParams.subscribe(params => {
        if (params['tecnico']) {
            this.nuevoTicket.personalId = params['tecnico'];
        }
    });
  }

  ngOnDestroy() {
    if (this.pollingTecnicos) {
        this.pollingTecnicos.unsubscribe();
    }
  }
  

  validarSoloNumeros(evento: KeyboardEvent): boolean {
    const codigoTecla = evento.which ? evento.which : evento.keyCode;
    if (codigoTecla > 31 && (codigoTecla < 48 || codigoTecla > 57)) {
      return false; 
    }
    return true; 
  }

  buscarDepartamento(evento: any) {
    const valorBuscado = evento.target.value;
    this.nuevoTicket.departamento = valorBuscado;
    this.mostrarSugerencias = true;

    if (valorBuscado && valorBuscado.trim() !== '') {
      this.departamentosSugeridos = this.listaDepartamentosBase.filter((departamento) => {
        return departamento.toLowerCase().includes(valorBuscado.toLowerCase());
      });
    } else {
      this.departamentosSugeridos = [...this.listaDepartamentosBase];
    }
  }

  elegirDepartamento(departamentoSeleccionado: string) {
    this.nuevoTicket.departamento = departamentoSeleccionado;
    this.mostrarSugerencias = false;
  }

  cerrarSugerenciasConRetraso() {
    setTimeout(() => {
      this.mostrarSugerencias = false;
    }, 200);
  }

  obtenerTecnicos() {
    this.apiService.getUsers().subscribe({
      next: (datosServidor) => {
        const usuariosRegistrados = datosServidor || [];
        this.listaTecnicos = usuariosRegistrados.filter((usuario: any) => usuario.rol === 'personal');
        this.cdr.detectChanges();
      },
      error: (errorRespuesta) => console.error('Error al actualizar técnicos', errorRespuesta)
    });
  }

obtenerReportesDelDia() {
    this.apiService.getTicketsHoy().subscribe({
      next: (datosServidor: any[]) => {
        this.reportesDelDia = Array.isArray(datosServidor) ? datosServidor : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.reportesDelDia = []; 
        this.cdr.detectChanges();
      }
    });
  }

 mostrarDetalleNota(textoNota: string) {
    const contenido = textoNota ? textoNota : '<span style="color: #94a3b8; font-style: italic;">Sin información adicional.</span>';

    Swal.fire({
      title: '<h3 style="color: #56212f; margin: 0; font-weight: 700;">Detalle de la Nota</h3>',
      html: `
        <div style="
          background-color: #f8fafc; 
          border: 1px solid #e2e8f0; 
          border-left: 5px solid #977e5b; 
          border-radius: 8px; 
          padding: 20px; 
          margin-top: 15px;
          text-align: left;
          font-size: 0.95rem;
          color: #334155;
          line-height: 1.6;
          max-height: 350px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        ">
          ${contenido}
        </div>
      `,
      icon: 'info',
      iconColor: '#56212f',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#000000',
      background: '#fff',
      width: '500px' 
    });
  }
  
  procesarRegistroTicket() {
    const camposVacios: string[] = [];

    if (!this.nuevoTicket.nombre_usuario) camposVacios.push('Solicitante');
    if (!this.nuevoTicket.apellido_usuario) camposVacios.push('Apellidos');
    if (!this.nuevoTicket.departamento)   camposVacios.push('Departamento');
    if (!this.nuevoTicket.municipio)      camposVacios.push('Municipio');
    if (!this.nuevoTicket.extension_tel)  camposVacios.push('Extensión o Teléfono');
    if (!this.nuevoTicket.personalId)     camposVacios.push('Técnico');
    if (!this.nuevoTicket.descripcion)    camposVacios.push('Categoría');
    if (!this.nuevoTicket.metodo_resolucion) camposVacios.push('Vía de atención esperada');
    if (!this.nuevoTicket.prioridad)      camposVacios.push('Prioridad');
    
    if (this.nuevoTicket.descripcion === 'Correo' && !this.nuevoTicket.correo_tipo) {
        camposVacios.push('Dominio del Correo (.edu o .gob)');
    }
    let detallesSoporte = '';
    if (this.nuevoTicket.descripcion === 'Tecnico') {
        const elementosSeleccionados = [];
        
        const tienePeriferico = this.nuevoTicket.soporte.impresora || this.nuevoTicket.soporte.escaner;
        const tienePrincipal = this.nuevoTicket.soporte.software || this.nuevoTicket.soporte.hardware;
        const tieneGarantias = this.nuevoTicket.soporte.garantias;

        if (tienePeriferico && !tienePrincipal) {
            Swal.fire({
                title: 'Falta especificar la falla',
                text: 'Seleccionaste Impresora o Escáner. Por favor indica arriba si el problema es de Software o Hardware.',
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#56212f'
            });
            return; 
        }

        if (!tienePrincipal && !tieneGarantias) {
            camposVacios.push('Tipo de Soporte (Debes seleccionar Software, Hardware o Gestión de Garantías)');
        } else {
            if (this.nuevoTicket.soporte.software) elementosSeleccionados.push('Software');
            if (this.nuevoTicket.soporte.hardware) elementosSeleccionados.push('Hardware');
            if (this.nuevoTicket.soporte.impresora) elementosSeleccionados.push('Impresora');
            if (this.nuevoTicket.soporte.escaner) elementosSeleccionados.push('Escáner');
            if (this.nuevoTicket.soporte.garantias) elementosSeleccionados.push('Garantías');

            detallesSoporte = elementosSeleccionados.join(', ');
        }
    }

    if (camposVacios.length > 0) {
      Swal.fire({
        title: 'Campos Incompletos',
        text: 'Por favor completa: ' + camposVacios.join(', '), 
        icon: 'warning', 
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#56212f' 
      });
      return; 
    }

    const tecnicoElegido = this.listaTecnicos.find(tecnico => tecnico.id == this.nuevoTicket.personalId);

    if (tecnicoElegido && (tecnicoElegido.estado_disponibilidad === 'ocupado' || tecnicoElegido.estado_disponibilidad === 'ausente')) {
        Swal.fire({
            title: 'Técnico no disponible',
            text: `El técnico ${tecnicoElegido.nombre} se encuentra ${tecnicoElegido.estado_disponibilidad}. Por favor selecciona otro.`,
            icon: 'error',
            confirmButtonColor: '#56212f'
        });
        return; 
    }

    const datosSecretaria = JSON.parse(localStorage.getItem('usuario_actual') || '{}');

    const cargaDatosTicket = {
      secretaria_id: datosSecretaria.id || null,
      nombre_usuario: this.nuevoTicket.nombre_usuario,
      apellido_usuario: this.nuevoTicket.apellido_usuario || '',
      departamento: this.nuevoTicket.departamento,
      municipio: this.nuevoTicket.municipio,
      descripcion: this.nuevoTicket.descripcion, 
      metodo_resolucion: this.nuevoTicket.metodo_resolucion,
      prioridad: this.nuevoTicket.prioridad,
      notas: this.nuevoTicket.notas || '',
      cantidad: this.nuevoTicket.cantidad_dicta, 
      extension_tel: this.nuevoTicket.extension_tel, 
      correo_tipo: this.nuevoTicket.correo_tipo, 
      soporte_tipo: detallesSoporte,
      personal: tecnicoElegido ? tecnicoElegido.nombre : 'Sin asignar',
      personal_id: tecnicoElegido ? tecnicoElegido.id : null,
      personal_email: tecnicoElegido ? tecnicoElegido.email : null
    };

    Swal.fire({
      title: 'Procesando ticket...',
      html: 'Guardando reporte y notificando al técnico. <br><b>Por favor espera...</b>',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.apiService.createTicket(cargaDatosTicket).subscribe({
      next: (respuestaServidor) => {
        if(respuestaServidor.status === true) {
          
          Swal.close();

          const alertaFlotante = Swal.mixin({
            toast: true, 
            position: 'top-end', 
            showConfirmButton: false, 
            timer: 3000, 
            timerProgressBar: true
          });
          alertaFlotante.fire({ icon: 'success', title: 'Ticket registrado correctamente' });

          this.nuevoTicket = { 
            nombre_usuario: '', 
            apellido_usuario: '',
            departamento: '', 
            municipio: "",
            personalId: '', 
            descripcion: '', 
            prioridad: '', 
            metodo_resolucion: '',
            notas: '', 
            cantidad_dicta: null, 
            extension_tel: '', 
            correo_tipo: '',
            soporte: { impresora: false, escaner: false, software: false, hardware: false, garantias: false }
          };
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);

        } else {
          Swal.fire({ icon: 'error', title: 'Error al guardar', text: respuestaServidor.error || respuestaServidor.message, confirmButtonColor: '#56212f' });
        }
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo conectar con el servidor', confirmButtonColor: '#56212f' });
      }
    });
  }

  
confirmarEliminarTicket(reporte: any) {
  const usuarioActual = JSON.parse(localStorage.getItem('usuario_actual') || '{}');
  const esPropietaria = reporte.secretaria_id == usuarioActual.id;

  Swal.fire({
    title: `Ticket #${reporte.id}`,
    html: `
      <p style="color: #64748b; margin: 0;">
        Técnico: <strong>${reporte.personal}</strong><br>
        Categoría: <strong>${reporte.descripcion}</strong><br>
        Municipio: <strong>${reporte.municipio || '-'}</strong>
      </p>
      
      ${esPropietaria ? `
        <div style="margin-top: 15px; text-align: left;">
          <label style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            Editar Municipio:
          </label>
          <input id="input-municipio" value="${reporte.municipio || ''}"
            style="width: 100%; margin-top: 6px; padding: 10px 14px; border: 1px solid #e2e8f0;
                   border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; outline: none;">

          <label style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 10px; display:block;">
            Editar Descripción:
          </label>
          <input id="input-descripcion" value="${reporte.descripcion || ''}"
            style="width: 100%; margin-top: 6px; padding: 10px 14px; border: 1px solid #e2e8f0;
                   border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; outline: none;">
        </div>
        
        <p style="color: #e74c3c; font-size: 0.85rem; margin-top: 15px; font-weight: 500;">
          <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: text-bottom; margin-right: 4px;">warning</span>
          Si eliminas este ticket, la acción no se podrá deshacer.
        </p>
      ` : `
        <div style="margin-top: 15px; padding: 12px; background-color: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 4px; text-align: left;">
           <p style="color: #475569; font-size: 0.85rem; margin: 0; line-height: 1.4;">
             Este ticket fue creado por otra persona. Solo puedes visualizar la información básica.
           </p>
        </div>
      `}
    `,
    icon: 'info',
    iconColor: '#56212f',
    showCancelButton: true,
    showConfirmButton: esPropietaria, 
    showDenyButton: esPropietaria,    
    confirmButtonText: 'Eliminar',
    confirmButtonColor: '#e74c3c',
    denyButtonText: 'Guardar cambios',
    denyButtonColor: '#2980b9',
    cancelButtonText: 'Cerrar',
    cancelButtonColor: '#000000',
    width: '450px'
  }).then((result) => {
    
    if (result.isDenied && esPropietaria) {
      const inputMuni = (document.getElementById('input-municipio') as HTMLInputElement)?.value?.trim() ?? '';
      const inputDesc = (document.getElementById('input-descripcion') as HTMLInputElement)?.value?.trim() ?? '';
      
      if (inputMuni !== '' || inputDesc !== '') {
        this.actualizarDatosTicket(reporte.id, inputMuni, inputDesc, usuarioActual.id, reporte);
      } else {
        Swal.fire('Atención', 'No ingresaste ningún dato nuevo para actualizar.', 'info');
      }
      return;
    }

    if (result.isConfirmed && esPropietaria) {
      this.apiService.deleteTicket(reporte.id, usuarioActual.id).subscribe({
        next: (res) => {
          if (res.status) {
            const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
            toast.fire({ icon: 'success', title: 'Ticket eliminado' });
            this.obtenerReportesDelDia();
          } else {
            Swal.fire({
              icon: 'info', iconColor: '#56212f',
              title: 'No se puede eliminar',
              html: `<p style="color:#64748b">El ticket <strong>#${reporte.id}</strong> no puede eliminarse porque ya fue <strong style="color:#27ae60">Completado</strong></p>
                     <p style="color:#94a3b8; font-size:0.8rem">Solo se pueden eliminar tickets que estén <strong style="color:#cebe35">En Espera</strong>.</p>`,
              confirmButtonText: 'Entendido', confirmButtonColor: '#56212f'
            });
          }
        },
        error: (err) => {
          if (err.status === 403) {
            Swal.fire({
              icon: 'info', iconColor: '#56212f',
              title: 'No se puede eliminar',
              html: `<p style="color:#64748b">El ticket <strong>#${reporte.id}</strong> ya fue <strong style="color:#27ae60">Completado</strong></p>`,
              confirmButtonText: 'Entendido', confirmButtonColor: '#56212f'
            });
          } else {
            Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
          }
        }
      });
    }
  });
}

actualizarDatosTicket(ticketId: number, municipio: string, notas: string, secretariaId: number, reporte: any) {
  const payload: any = {
    id: ticketId,
    secretaria_id: secretariaId
  };
  
  if (municipio !== '') payload.municipio = municipio;
  if (notas !== '') payload.notas = notas;

  this.apiService.editarTicket(payload).subscribe({
    next: (res) => {
      if (res.status) {
        if (municipio !== '') reporte.municipio = municipio;
        if (notas !== '') reporte.notas = notas;
        this.cdr.detectChanges();
        
        const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
        toast.fire({ icon: 'success', title: 'Ticket actualizado correctamente' });
      } else {
        Swal.fire('Error', res.message, 'error');
      }
    },
    error: () => Swal.fire('Error', 'No se pudo conectar con el servidor', 'error')
  });
}

mostrarNovedades() {
  const claveVista = 'novedad_eliminar_ticket_v4';
  if (localStorage.getItem(claveVista)) return;

  Swal.fire({
    title: '',
    html: `
 <div style="text-align: left; font-family: 'Segoe UI', sans-serif; padding: 4px 0;">

        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <span class="material-symbols-outlined" style="color: #56212f; font-size: 1.4rem;">new_releases</span>
          <div>
            <p style="margin: 0; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Actualización</p>
            <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a;">Nuevas funciones disponibles</h3>
          </div>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: #64748b; line-height: 1.5; padding-left: 2px;">
          Se han añadido un campo nuevo en el formulario de registro y una nueva herramientas para facilitar la exportación de datos.
        </p>

        <div style="display: flex; flex-direction: column; gap: 1px; border-radius: 10px; overflow: hidden; border: 1px solid #f1f5f9; margin-bottom: 16px;">

          <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
            <span class="material-symbols-outlined" style="color: #2980b9; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">location_on</span>
            <div>
              <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Nuevo campo: Municipio</p>
              <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
                Al registrar un nuevo ticket, ahora encontrarás el campo <strong>Municipio</strong>.
              </p>
            </div>
          </div>

          <div style="height: 1px; background: #f1f5f9;"></div>

          <div style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: #fafafa;">
            <span class="material-symbols-outlined" style="color: #10b981; font-size: 1.2rem; flex-shrink: 0; margin-top: 1px;">download</span>
            <div>
              <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 0.85rem;">Exportar Historial a Excel</p>
              <p style="margin: 3px 0 0 0; color: #64748b; font-size: 0.8rem; line-height: 1.5;">
                Dentro de la pestaña de <strong>Historial</strong>, se agregó un nuevo botón que te permite descargar todos los reportes a Excel.
              </p>
            </div>
          </div>

        </div>

        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: rgba(86,33,47,0.04); border-radius: 8px; border-left: 2px solid #56212f;">
          <span class="material-symbols-outlined" style="color: #56212f; font-size: 1rem; flex-shrink: 0; margin-top: 1px;">info</span>
          <p style="margin: 0; font-size: 0.78rem; color: #56212f; line-height: 1.5;">
            Toma en cuenta que la descarga a Excel generará un archivo iCSV el cual debes filtrar en excel para obtener correctamente los datos sin caracteres corrompidos por los asentos o signos.
          </p>
        </div>

      </div>
    `,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#56212f',
    width: window.innerWidth < 600 ? '92vw' : '460px',
  }).then(() => {
    localStorage.setItem(claveVista, 'true');
  });
}


}
    