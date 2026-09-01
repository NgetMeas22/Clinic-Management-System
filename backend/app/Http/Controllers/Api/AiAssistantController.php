<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantController extends Controller
{
    public function ask(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
        ]);

        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model', 'gemini-3.6-flash');

        if (empty($apiKey)) {
            Log::error('AI Assistant: GEMINI_API_KEY is not set in backend/.env');
            return response()->json([
                'error' => 'Server AI configuration error: Gemini API key is missing. Please set GEMINI_API_KEY in backend/.env.',
            ], 500);
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";

        $systemInstruction = "អ្នកគឺជាជំនួយការ AI របស់ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក NGM Clinic។ សូមឆ្លើយតបជាភាសាខ្មែរ ឱ្យមានភាពសុភាពរាបសារ និងច្បាស់លាស់។";

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(60)->post($endpoint, [
                'model' => $model,
                'input' => $systemInstruction . "\n\nសំណួរ៖ " . $request->prompt,
            ]);
        } catch (\Throwable $e) {
            Log::error('AI Assistant request exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'កំហុសក្នុងការបញ្ជូនសំណួរ៖ ' . $e->getMessage(),
            ], 500);
        }

        if ($response->successful()) {
            $data = $response->json();

            $reply = $data['output_text']
                ?? $data['outputText']
                ?? $this->extractModelOutputText($data['steps'] ?? []);

            if ($reply === null || $reply === '') {
                Log::error('AI Assistant: empty reply payload.', ['response' => $data]);
                return response()->json([
                    'reply' => 'សុំទោស មិនមានការឆ្លើយតបទេ។',
                ]);
            }

            return response()->json(['reply' => $reply]);
        }

        $googleError = $response->json('error.message')
            ?: $response->json('message')
            ?: $response->body();

        Log::error('AI Assistant failed: ' . $googleError);

        return response()->json([
            'error' => 'មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ AI API៖ ' . $googleError,
        ], 500);
    }

    protected function extractModelOutputText(array $steps): ?string
    {
        $texts = [];

        foreach ($steps as $step) {
            if (($step['type'] ?? null) !== 'model_output') {
                continue;
            }

            foreach ($step['content'] ?? [] as $part) {
                if (($part['type'] ?? null) === 'text' && !empty($part['text'])) {
                    $texts[] = $part['text'];
                }
            }
        }

        return $texts === [] ? null : implode("\n", $texts);
    }
}
