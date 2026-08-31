<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiAssistantController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
        ]);

        $apiKey = env('GEMINI_API_KEY');
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";

        $systemInstruction = "អ្នកគឺជាជំនួយការ AI របស់ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក NGM Clinic។ សូមឆ្លើយតបជាភាសាខ្មែរ ឱ្យមានភាពសុភាពរាបសារ និងច្បាស់លាស់។";

        $response = Http::post($endpoint, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $systemInstruction . "\n\nសំណួរ៖ " . $request->prompt]
                    ]
                ]
            ]
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'សុំទោស មិនមានការឆ្លើយតបទេ។';
            return response()->json(['reply' => $reply]);
        }

        return response()->json(['error' => 'មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ AI API'], 500);
    }
}
