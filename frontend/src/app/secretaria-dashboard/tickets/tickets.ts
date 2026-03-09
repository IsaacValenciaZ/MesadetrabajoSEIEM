import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs'; 

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
  ];

  departamentosSugeridos: string[] = [...this.listaDepartamentosBase];

  nuevoTicket: any = { 
    nombre_usuario: '', 
    departamento: '',
    personalId: '',     
    descripcion: '',    
    prioridad: '',
    notas: '',
    cantidad_dicta: null,
    extension_tel: '',
    correo_tipo: '',
    soporte: {
      impresora: false,
      escaner: false,
      software: false,
      hardware: false
    }
  };

  ngOnInit() {
    this.obtenerTecnicos();
    this.obtenerReportesDelDia();

    this.pollingTecnicos = interval(15000).subscribe(() => {
        this.obtenerTecnicos();
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
      iconColor: '#977e5b',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#000000',
      background: '#fff',
      width: '500px' 
    });
  }
  
  procesarRegistroTicket() {
    const camposVacios: string[] = [];

    if (!this.nuevoTicket.nombre_usuario) camposVacios.push('Solicitante');
    if (!this.nuevoTicket.departamento)   camposVacios.push('Departamento');
    if (!this.nuevoTicket.extension_tel)  camposVacios.push('Extensión o Teléfono');
    if (!this.nuevoTicket.personalId)     camposVacios.push('Técnico');
    if (!this.nuevoTicket.descripcion)    camposVacios.push('Categoría');
    if (!this.nuevoTicket.prioridad)      camposVacios.push('Prioridad');
    
    if (this.nuevoTicket.descripcion === 'Correo' && !this.nuevoTicket.correo_tipo) {
        camposVacios.push('Dominio del Correo (.edu o .gob)');
    }

    let detallesSoporte = '';
    if (this.nuevoTicket.descripcion === 'Tecnico') {
        const elementosSeleccionados = [];
        if (this.nuevoTicket.soporte.impresora) elementosSeleccionados.push('Impresora');
        if (this.nuevoTicket.soporte.escaner) elementosSeleccionados.push('Escáner');
        if (this.nuevoTicket.soporte.software) elementosSeleccionados.push('Software');
        if (this.nuevoTicket.soporte.hardware) elementosSeleccionados.push('Hardware');

        if (elementosSeleccionados.length === 0) {
            camposVacios.push('Opciones de Soporte (Selecciona al menos una)');
        } else {
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
      departamento: this.nuevoTicket.departamento,
      descripcion: this.nuevoTicket.descripcion, 
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
            departamento: '', 
            personalId: '', 
            descripcion: '', 
            prioridad: '', 
            notas: '', 
            cantidad_dicta: null, 
            extension_tel: '', 
            correo_tipo: '',
            soporte: { impresora: false, escaner: false, software: false, hardware: false }
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
}