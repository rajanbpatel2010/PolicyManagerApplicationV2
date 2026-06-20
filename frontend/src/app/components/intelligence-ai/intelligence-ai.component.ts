import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { SpinnerComponent } from '../shared/spinner/spinner.component';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-intelligence-ai',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  template: `
    <div class="page-container ai-page animate__animated animate__fadeIn">
      <div class="page-header-refined">
        <div class="header-main">
          <div class="header-titles">
            <h1 class="dashboard-title-compact">
              <span class="material-icons-round text-gradient" style="vertical-align:middle;margin-right:12px;font-size:2rem !important">auto_awesome</span>
              Intelligence AI
            </h1>
            <p class="dashboard-subtitle-compact">Your personal insurance portfolio assistant powered by Gemini</p>
          </div>
        </div>
      </div>

      <div class="chat-container glass-card">
        <div class="chat-messages custom-scrollbar" #scrollMe>
          <div *ngIf="messages.length === 0" class="welcome-container">
            <div class="ai-glow-icon">
              <span class="material-icons-round">auto_awesome</span>
            </div>
            <h3>Intelligent Portfolio Analysis</h3>
            <p>I can help you analyze your coverage, find savings, and track your premiums. What would you like to know?</p>
            
            <div class="suggestion-grid">
              <div class="suggestion-card" (click)="query = 'Analyze my total portfolio coverage'; sendMessage()">
                <span class="material-icons-round">analytics</span>
                <span>Analyze Coverage</span>
              </div>
              <div class="suggestion-card" (click)="query = 'How much tax can I save this year?'; sendMessage()">
                <span class="material-icons-round">savings</span>
                <span>Tax Savings</span>
              </div>
              <div class="suggestion-card" (click)="query = 'List policies expiring in next 6 months'; sendMessage()">
                <span class="material-icons-round">event_note</span>
                <span>Upcoming Expiries</span>
              </div>
              <div class="suggestion-card" (click)="query = 'What is my average monthly premium?'; sendMessage()">
                <span class="material-icons-round">payments</span>
                <span>Premium Insights</span>
              </div>
            </div>
          </div>

          <div *ngFor="let msg of messages" [class]="'message-wrapper ' + msg.role">
            <div class="message-avatar" [class.ai-avatar]="msg.role === 'ai'">
              <span class="material-icons-round">{{ msg.role === 'ai' ? 'auto_awesome' : 'person' }}</span>
            </div>
            <div class="message-content">
              <div class="message-bubble" [class.ai-bubble]="msg.role === 'ai'">
                <div class="msg-text" [innerHTML]="formatContent(msg.content)"></div>
              </div>
              <span class="message-time">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
          </div>

          <div *ngIf="loading" class="message-wrapper ai">
            <div class="message-avatar ai-avatar">
              <span class="material-icons-round">auto_awesome</span>
            </div>
            <div class="message-content">
              <div class="message-bubble ai-bubble loading-bubble">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div class="input-wrapper">
            <input type="text" 
                   [(ngModel)]="query" 
                   (keydown.enter)="sendMessage()"
                   placeholder="Ask me anything about your policies..."
                   [disabled]="loading">
            <button class="send-btn" (click)="sendMessage()" [disabled]="loading || !query.trim()">
              <span class="material-icons-round">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-page {
      height: calc(100vh - 140px);
      display: flex;
      flex-direction: column;
    }
    
    .text-gradient {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-top: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(15, 23, 42, 0.3);
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    
    .welcome-container {
      margin: auto;
      text-align: center;
      max-width: 600px;
      padding: 2rem;
    }
    
    .ai-glow-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #818cf8;
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
    }
    
    .ai-glow-icon span { font-size: 40px; }
    
    .welcome-container h3 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.75rem; color: #fff; }
    .welcome-container p { color: #94a3b8; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; }
    
    .suggestion-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .suggestion-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 1.25rem;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .suggestion-card span:first-child { color: #818cf8; font-size: 24px; }
    .suggestion-card span:last-child { color: #e2e8f0; font-size: 0.85rem; font-weight: 600; }
    
    .suggestion-card:hover {
      background: rgba(99, 102, 241, 0.1);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-5px);
    }
    
    .message-wrapper {
      display: flex;
      gap: 1.25rem;
      max-width: 85%;
      animation: messageSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes messageSlide {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .message-wrapper.user { align-self: flex-end; flex-direction: row-reverse; }
    
    .message-avatar {
      width: 40px; height: 40px; border-radius: 12px;
      background: #1e293b; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);
    }
    
    .user .message-avatar { background: #6366f1; color: white; border: none; }
    .ai-avatar { background: rgba(99, 102, 241, 0.15); color: #818cf8; border-color: rgba(99, 102, 241, 0.2); }
    
    .message-bubble {
      padding: 14px 18px;
      border-radius: 18px;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    
    .user .message-bubble {
      background: #6366f1; color: white; border-top-right-radius: 4px;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }
    
    .ai-bubble {
      background: rgba(30, 41, 59, 0.8); color: #e2e8f0;
      border-top-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05);
    }
    
    .msg-text :host ::ng-deep b { color: #fff; font-weight: 700; }
    
    .chat-input-area {
      padding: 1.5rem 2.5rem;
      background: rgba(2, 6, 23, 0.6);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .input-wrapper {
      display: flex; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; padding: 8px 8px 8px 20px; gap: 12px; align-items: center;
    }
    
    .input-wrapper:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
    
    input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 1rem; }
    
    .send-btn {
      width: 44px; height: 44px; border-radius: 12px;
      background: #6366f1; color: white; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    
    .send-btn:hover:not(:disabled) { transform: scale(1.05); background: #4f46e5; }
    
    /* Typing Indicator */
    .typing-indicator { display: flex; gap: 4px; padding: 4px 0; }
    .typing-indicator span {
      width: 6px; height: 6px; background: #818cf8; border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `]
})
export class IntelligenceAiComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  query = '';
  loading = false;

  constructor(private aiService: AiService) {}

  ngOnInit(): void {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTo({
        top: this.myScrollContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    } catch(err) { }
  }

  formatContent(content: string): string {
    if (!content) return '';
    // Bold patterns like **text**
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Simple line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  sendMessage(): void {
    if (!this.query.trim() || this.loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: this.query,
      timestamp: new Date()
    };

    this.messages.push(userMsg);
    const userQuery = this.query;
    this.query = '';
    this.loading = true;

    this.aiService.queryPortfolio(userQuery).subscribe({
      next: (res) => {
        const aiMsg: ChatMessage = {
          role: 'ai',
          content: res.data || "I'm sorry, I couldn't generate a response.",
          timestamp: new Date()
        };
        this.messages.push(aiMsg);
        this.loading = false;
      },
      error: () => {
        const errorMsg: ChatMessage = {
          role: 'ai',
          content: "I'm having trouble connecting to my brain right now. Please try again later.",
          timestamp: new Date()
        };
        this.messages.push(errorMsg);
        this.loading = false;
      }
    });
  }
}
