import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent {
  private apiService = inject(ApiService);

  @Input() user: any; 
  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<void>(); 

  guardar() {
    if (this.user.nombre && this.user.email) {
      
      this.apiService.updateUser(this.user).subscribe({
        next: (res) => {
          // Si el servidor responde con status: true, todo salió bien
          if (res.status) {
            Swal.fire({
              icon: 'success',
              title: '¡Cambios Guardados!',
              text: 'La información del usuario se actualizó correctamente.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#56212f'
            });

            this.update.emit(); 
            this.close.emit();
          } else {
            // Si res.status es false, mostramos el mensaje de error del backend (ej: "Correo ya existe")
            Swal.fire({
              icon: 'error',
              title: 'No se pudo actualizar',
              text: res.message, 
              confirmButtonColor: '#56212f'
            });
          }
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo conectar con la base de datos.',
            confirmButtonColor: '#56212f'
          });
        }
      });

    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Por favor, no dejes campos vacíos.',
        confirmButtonColor: '#000000'
      });
    }
  }
}