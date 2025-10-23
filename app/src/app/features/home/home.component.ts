import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {
    console.log('🏠 HomeComponent initialized');
    console.log('📁 Checking badge image path...');
    
    // Test if the image loads
    const img = new Image();
    img.onload = () => console.log('✅ Badge image loaded successfully:', img.src);
    img.onerror = () => console.log('❌ Badge image failed to load:', img.src);
    // Use path relative to base href (/app/) so it works on Pages
    img.src = 'assets/signed_badge.png';
    
    console.log('🖼️ Badge image src:', img.src);
  }
}
