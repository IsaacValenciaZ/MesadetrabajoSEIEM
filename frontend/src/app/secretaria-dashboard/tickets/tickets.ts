import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html', 
  styleUrl: './tickets.css' 
})
export class TicketsComponent implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  listaTecnicos: any[] = [];
  reportesDelDia: any[] = []; 
  fechaSistema = new Date();
  mostrarSugerencias = false;
  
  listaDepartamentosBase: string[] = [
    "Consejo Directivo", "Dirección General", "Órgano Interno de Control", 
    "Unidad de Modernización para la Calidad del Servicio", "Unidad de Asuntos Jurídicos e Igualdad de Género", 
    "Unidad de Comunicación Social", "Secretaría Técnica de la Junta de Gobierno",
    "Área de Auditoría", "Área de Quejas", "Área de Responsabilidades",
    "Depto. de Estudios y Proyectos para el Desarrollo Institucional", "Depto. de Sistemas Administrativos", 
    "Centro de Información y Documentación", "Depto. Jurídico Contencioso", "Depto. de Legislación y Consulta", 
    "Depto. de Asuntos Relacionados con los Derechos Humanos", "Depto. Jurídico Valle de México",
    "Subdirección de Educación Elemental", "Depto. de Planeación y Programación", "Depto. de Estadística", 
    "Depto. de Control Escolar", "Depto. de Evaluación Institucional", 
    "Depto. de Computación Electrónica en la Educación Elemental", "Depto. de Extensión y Vinculación Educativa",
    "Depto. de Educación Inicial", "Depto. de Educación Inicial No Escolarizada", "Depto. de Educación para Adultos",
    "Depto. de Educación Especial Valle de México", "Depto. de Educación Especial Valle de Toluca",
    "Depto. de Educación Preescolar del Valle de Toluca", "Depto. de Educación Preescolar del Valle de México",
    "Subdirección de Educación Primaria Región Toluca", "Subdirección de Educación Primaria Región Atlacomulco",
    "Subdirección de Educación Primaria Región Naucalpan", "Subdirección de Educación Primaria Región Ecatepec", 
    "Subdirección de Educación Primaria Región Nezahualcóyotl",
    "Subdirección de Educación Secundaria Valle de Toluca", "Depto. de Educación Secundaria General (Toluca)", 
    "Depto. de Educación Secundaria Técnica (Toluca)", "Depto. de Telesecundaria (Toluca)",
    "Subdirección de Educación Secundaria Valle de México", "Depto. de Educación Secundaria General (Valle Mex)", 
    "Depto. de Educación Secundaria Técnica (Valle Mex)", "Depto. de Telesecundaria (Valle Mex)",
    "Subdirección de Servicios Regionales Naucalpan", "Subdirección de Servicios Regionales Ecatepec", 
    "Subdirección de Servicios Regionales Nezahualcóyotl",
    "Depto. de Espacios Escolares", "Depto. de Equipamiento Escolar", "Depto. de Preservación de Instalaciones",
    "Subdirección de Desarrollo de Personal", "Subdirección de Administración de Personal", 
    "Depto. de Capacitación y Desarrollo", "Depto. de Prestaciones", "Depto. de Control y Calidad de Pago", 
    "Depto. de Registro y Archivo",
    "Subdirección de Recursos Materiales y Servicios", "Subdirección de Finanzas", 
    "Subdirección de Distribución de Cheques", "Depto. de Adquisiciones", "Depto. de Programación y Presupuesto", 
    "Depto. de Servicios Generales", "Depto. de Contabilidad", "Depto. de Almacén", "Depto. de Tesorería", 
    "Depto. de Inventarios",
    "Dirección de Informática - Depto. Técnico", "Dirección de Informática - Depto. Desarrollo de Sistemas", 
    "Dirección de Informática - Depto. Producción",
    "Depto. de Formación Profesional", "Depto. de Posgrado e Investigación", "Depto. de Actualización",
    "Coordinación Académica y de Operación Educativa", "Coordinación de Administración y Finanzas",
    "Depto. de Admisión y Promoción Vertical", "Depto. de Reconocimiento", "Depto. de Promoción en el Servicio",
    "Depto. de Educación Indígena", "Depto. para el Desarrollo de la Calidad Educativa", 
    "Depto. de Computación Electrónica Secundaria", "Depto. de Educación Física del Valle de México", 
    "Depto. de Educación Física del Valle de Toluca",
    "Depto. de Preparatoria Abierta Valle de México", "Depto. de Preparatoria Abierta Valle de Toluca",
    "Depto. de Apoyo Técnico", "Depto. de Administración de Personal", 
    "Depto. de Recursos Materiales y Financieros (Regionalizados)", "Depto. de Asuntos Laborales", 
    "Depto. de Trámite y Control de Personal", "Pagaduría Valle de Toluca", "Pagaduría Valle de México",
    "Dirección de Planeación y Evaluación"
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
      error: (errorRespuesta) => console.error(errorRespuesta)
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
    Swal.fire({
      title: 'Detalle de la Nota',
      text: textoNota ? textoNota : 'Sin información adicional.',
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#000000',
      background: '#fff',
      iconColor: '#977e5b'
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

    this.apiService.createTicket(cargaDatosTicket).subscribe({
      next: (respuestaServidor) => {
        if(respuestaServidor.status === true) {
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