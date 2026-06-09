<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdvokasiProgressMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $pekerja;
    public $judulKasus;
    public $namaTahapan;
    public $statusTahapan;
    public $pesanTambahan;

    /**
     * Create a new message instance.
     */
    public function __construct($pekerja, $judulKasus, $namaTahapan, $statusTahapan, $pesanTambahan = null)
    {
        $this->pekerja = $pekerja;
        $this->judulKasus = $judulKasus;
        $this->namaTahapan = $namaTahapan;
        $this->statusTahapan = $statusTahapan;
        $this->pesanTambahan = $pesanTambahan;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subjectPrefix = $this->statusTahapan === 'Selesai' ? 'Tahap Selesai:' : 'Update Proses:';
        
        return new Envelope(
            subject: "{$subjectPrefix} {$this->namaTahapan}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.advokasi_progress',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
