import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-supervisor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supervisor-profile.html',
  styleUrls: ['./supervisor-profile.css']
})
export class SupervisorProfileComponent implements OnInit {
  private apiService = inject(ApiService);

  datosUsuario: any = { nombre: '', email: '' };
  nuevaContrasena = '';
  confirmarContrasena = '';

  ngOnInit() {
    const sesion = localStorage.getItem('usuario_actual');
    if (sesion) {
      this.datosUsuario = JSON.parse(sesion);
    }
  }

  procesarActualizacionPerfil() {
    if (!this.datosUsuario.nombre || !this.datosUsuario.email) {
      Swal.fire('Atención', 'Datos incompletos', 'warning');
      return;
    }

    if (this.nuevaContrasena && this.nuevaContrasena !== this.confirmarContrasena) {
      Swal.fire('Atención', 'Las contraseñas no coinciden', 'warning');
      return;
    }

    const objetoEnvio = {
      id: this.datosUsuario.id,
      nombre: this.datosUsuario.nombre,
      email: this.datosUsuario.email,
      password: this.nuevaContrasena
    };

    this.apiService.updateProfile(objetoEnvio).subscribe({
      next: (respuesta: any) => {
        if (respuesta.status) {
          const sesion = localStorage.getItem('usuario_actual');
          if (sesion) {
            let usuario = JSON.parse(sesion);
            usuario.nombre = this.datosUsuario.nombre;
            usuario.email = this.datosUsuario.email;
            localStorage.setItem('usuario_actual', JSON.stringify(usuario));
          }
          Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Perfil actualizado', confirmButtonColor: '#56212f' })
            .then(() => window.location.reload());
        } else {
          Swal.fire('Error', respuesta.message, 'error');
        }
      },
      error: () => Swal.fire('Error', 'No se pudo conectar con el servidor', 'error')
    });
  }
}