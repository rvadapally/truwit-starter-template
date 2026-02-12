import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-openclaw-mcp-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./openclaw-mcp-page.component.scss'],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <div class="badge">TruWit OpenClaw MCP</div>
          <h1>Continuous Compliance Evidence + Questionnaire Autopilot</h1>
          <p class="subtitle">
            Stop spending weeks on SOC 2 / HIPAA security questionnaires. Keep evidence current automatically.
            Powered by an always-on agent runtime with strict guardrails, approvals, and audit logs.
          </p>
          <div class="hero-actions">
            <a href="mailto:assistant@truwit.ai?subject=TruWit%20OpenClaw%20MCP%20Pilot" class="btn-primary">Request a 14-day Pilot</a>
            <a routerLink="/products" class="btn-secondary">See All Products</a>
          </div>
          <div class="hero-trust">
            <span class="trust-badge">🔒 Approve-to-act</span>
            <span class="trust-badge">🧾 Audit logs</span>
            <span class="trust-badge">📦 Evidence exports</span>
          </div>
        </div>
      </section>

      <section class="content">
        <div class="container">
          <h2>What it does</h2>
          <div class="grid">
            <div class="card">
              <h3>1) Security Questionnaire Autopilot</h3>
              <p>
                Upload a vendor questionnaire (SOC 2 / HIPAA / VRA). We map questions to your standard answers,
                attach evidence links, draft responses, and flag gaps.
              </p>
              <ul>
                <li><strong>Mode:</strong> auto-draft + human approval</li>
                <li><strong>Output:</strong> completed questionnaire + evidence index</li>
              </ul>
            </div>

            <div class="card">
              <h3>2) Continuous Evidence Collector</h3>
              <p>
                On a schedule, we collect the evidence you always scramble for: access logs, MFA settings,
                user lists, backups, patch posture, configuration snapshots.
              </p>
              <ul>
                <li><strong>Mode:</strong> automated collection + human review</li>
                <li><strong>Output:</strong> monthly evidence packet + change log</li>
              </ul>
            </div>

            <div class="card">
              <h3>3) Policy Drift Detection</h3>
              <p>
                We detect drift from your “golden baseline” (permissions, configurations, agent policies)
                and propose safe remediations.
              </p>
              <ul>
                <li><strong>Mode:</strong> detect + propose; apply only with approval</li>
                <li><strong>Output:</strong> drift report + fix plan</li>
              </ul>
            </div>
          </div>

          <h2>Guardrails (non-negotiable)</h2>
          <div class="grid">
            <div class="card">
              <h3>Approve-to-act</h3>
              <p>Anything risky is draft-first. You approve before actions run.</p>
            </div>
            <div class="card">
              <h3>Least privilege</h3>
              <p>Minimal scopes. Separate service accounts. No “god mode” credentials.</p>
            </div>
            <div class="card">
              <h3>Audit logs + evidence exports</h3>
              <p>Every tool call and approval is recorded and exportable.</p>
            </div>
          </div>

          <h2>How the pilot works (14 days)</h2>
          <ol class="steps">
            <li><strong>Day 1–2:</strong> pick 1 questionnaire + define evidence checklist</li>
            <li><strong>Day 3–7:</strong> autopilot drafts + evidence collection + review</li>
            <li><strong>Day 8–14:</strong> finalize + deliver your evidence pack + repeatable process</li>
          </ol>

          <div class="cta">
            <h2>Want this running for your team?</h2>
            <p>Reply “pilot” and we’ll start with one questionnaire and one evidence pack.</p>
            <a href="mailto:assistant@truwit.ai?subject=Pilot%20-%20TruWit%20OpenClaw%20MCP" class="btn-primary">Email: assistant&#64;truwit.ai</a>
          </div>
        </div>
      </section>
    </div>
  `
})
export class OpenClawMcpPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.title.setTitle('TruWit OpenClaw MCP - Continuous Compliance Evidence + Questionnaire Autopilot');
    this.meta.updateTag({
      name: 'description',
      content: 'Automate SOC 2 / HIPAA security questionnaires and keep compliance evidence current with approvals and audit logs. TruWit OpenClaw MCP.'
    });
  }
}
