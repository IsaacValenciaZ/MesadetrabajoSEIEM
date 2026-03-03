import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.css']
})
export class DeleteUserComponent {
  private apiService = inject(ApiService);

  @Input() user: any; 
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  
  confirmar() {
    if (this.user && this.user.id) {
      this.apiService.deleteUser(this.user.id).subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: '¡Usuario Eliminado!',
            text: `El registro de ${this.user.nombre} ha sido borrado.`,
            confirmButtonColor: '#56212f'
          });

          this.delete.emit(); 
          this.close.emit();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
        }
      });
    }
  }
}