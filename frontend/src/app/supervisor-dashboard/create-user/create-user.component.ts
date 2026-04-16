import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {
  private apiService = inject(ApiService);

  newUser = {
    nombre: '',
    email: '',
    password: '123456',
    rol: 'personal',
    requiereCambio: true
  };

  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<any>();

 crear() {
    if (this.newUser.nombre && this.newUser.email) {
      this.apiService.register(this.newUser).subscribe({
        next: (res) => {
          
          if (res && res.status) {
            Swal.fire({
              icon: 'success',
              title: '¡Usuario Registrado Correctamente!',
              text: `Se ha enviado un correo a  ${this.newUser.nombre}`,
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#56212f'
            });

            this.create.emit(res); 
            
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error de Registro',
              text: res.message || 'Ocurrió un error al registrar el usuario',
              confirmButtonColor: '#56212f'
            });
          }
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo comunicar con el servidor para enviar el correo',
            confirmButtonColor: '#56212f'
          });
        }
      });
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Incompletos',
        text: 'Por favor, llena todos los campos solicitados',
        confirmButtonColor: '#56212f'
      });
    }
  }
}