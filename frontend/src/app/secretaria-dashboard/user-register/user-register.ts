import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; 
@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-register.html',
  styleUrl: './user-register.css'
})
export class UserRegisterComponent {
  private apiService = inject(ApiService);
  private router = inject(Router);

  newUser = { nombre: '', email: '', password: '', rol: 'personal' };

  registrarUsuario() {
    this.apiService.register(this.newUser).subscribe({
      next: () => {
        Swal.fire({
  icon: 'success',
  title: '¡Usuario Registrado!',
  text: 'Los datos se han guardado correctamente en el sistema.',
  confirmButtonText: 'Aceptar',
  confirmButtonColor: '#000000' 
});
        this.router.navigate(['/secretaria/usuarios']); 
      },
      error: () => alert('Error al registrar')
    });
  }
}