import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-personal-activo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-activo.component.html',
  styleUrls: ['./personal-activo.component.css']
})
export class PersonalActivoComponent implements OnInit {
  private http = inject(HttpClient);
 
  private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/get_users.php';
  //private apiUrl = 'http://localhost/mesatrabajoBACKEND/backend/get_users.php';
  personalList: any[] = [];
  loading: boolean = true;

  ngOnInit() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
      
        this.personalList = data.filter(u => u.rol && u.rol.toLowerCase() === 'personal');
        this.loading = false;
      },
      error: (err) => {
        console.error("Error cargando personal:", err);
        this.loading = false;
      }
    });
  }
}