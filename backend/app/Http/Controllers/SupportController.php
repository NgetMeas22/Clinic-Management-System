<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SupportController extends Controller
{
    public function sendSupportMessage(Request $request)
    {
        $request->validate([
            'subject' => 'required|string',
            'message' => 'required|string',
            'user_name' => 'nullable|string',
            'user_email' => 'nullable|string',
        ]);

        $botToken = env('TELEGRAM_BOT_TOKEN');
        $chatId = env('TELEGRAM_CHAT_ID');

        // ទាញយកឈ្មោះ និង Email (បើកន្លែងណាគ្មាន វានឹងយកតម្លៃជំនួស)
        $senderName = auth()->user()->name ?? $request->user_name ?? 'Clinic User';
        $senderEmail = auth()->user()->email ?? $request->user_email ?? 'N/A';

        // រៀបចំទម្រង់សារ
        $text = "📩 **New Support Message**\n\n";
        $text .= "📌 **Subject:** " . $request->subject . "\n";
        $text .= "💬 **Message:** " . $request->message . "\n";
        $text .= "👤 **Sent By:** " . $senderName . " (" . $senderEmail . ")";

        // ផ្ញើទៅ Telegram API
        $response = Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
        ]);

        if ($response->successful()) {
            return response()->json(['message' => 'Message sent to Telegram successfully!'], 200);
        }

        return response()->json(['error' => 'Failed to send message.'], 500);
    }
}