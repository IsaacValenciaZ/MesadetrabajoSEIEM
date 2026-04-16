import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dictamen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dictamenes.html',
  styleUrls: ['./dictamenes.css']
})
export class DictamenesComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router); 

  listaTecnicos: any[] = [];

dictamenesProgramados: any[] = []; 

  nuevoDictamen = {
    nombre_usuario: '',
    apellido_usuario: '',
    escuela: '',
    extension: '',
    cantidad_equipos: null,
    tecnico_asignado: '',
    fecha_programada: '',
    notas: ''
  };

ngOnInit() {
    this.obtenerTecnicos();
    this.obtenerDictamenes(); 
  }

  obtenerTecnicos() {
    this.apiService.getUsers().subscribe({
      next: (datos) => {
        this.listaTecnicos = (datos || []).filter((usuario: any) => usuario.rol === 'personal');
      }
    });
  }

  obtenerDictamenes() {
    this.apiService.getDictamenes().subscribe({
      next: (datos) => {
        this.dictamenesProgramados = datos || [];
      },
      error: (err) => console.error('Error al obtener dictámenes', err)
    });
  }

  guardarDictamen() {
    if (!this.nuevoDictamen.nombre_usuario || !this.nuevoDictamen.escuela || !this.nuevoDictamen.tecnico_asignado || !this.nuevoDictamen.fecha_programada) {
      Swal.fire('Campos Incompletos', 'Por favor llena todos los campos obligatorios (*).', 'warning');
      return;
    }

    Swal.fire({
      title: 'Programando Dictamen...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.apiService.createDictamen(this.nuevoDictamen).subscribe({
      next: (res) => {
        if (res.status) {
          Swal.fire({
            icon: 'success',
            title: '¡Programado!',
            text: res.message,
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            // REDIRECCIÓN a la vista de tickets
            this.router.navigate(['/secretaria/tickets']);
          });
        } else {
          Swal.fire('Error', res.message, 'error');
        }
      },
      error: () => Swal.fire('Error', 'No se pudo conectar con el servidor', 'error')
    });
  }
}