'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState('Hi {{firstName}}, we have an exciting opportunity for you!');
  const [tone, setTone] = useState<'sales' | 'support' | 'reminder' | 'follow-up'>('sales');
  const [language, setLanguage] = useState('English');
  const [respectTimezones, setRespectTimezones] = useState(true);
  const [parseResult, setParseResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('/api/parse-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setParseResult(data);
    } catch (error) {
      alert('Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!parseResult?.valid?.length) {
      alert('No valid contacts to process');
      return;
    }

    setLoading(true);
    setCampaignStatus('Starting campaign...');
    setResults([]);

    try {
      const response = await fetch('/api/launch-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: parseResult.valid,
          config: {
            template,
            tone,
            language,
            respectTimezones,
            respectDoNotContact: true,
          },
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.status) {
                setCampaignStatus(data.status);
              }
              if (data.result) {
                setResults(prev => [...prev, data.result]);
              }
            }
          }
        }
      }

      setCampaignStatus('Campaign completed!');
    } catch (error) {
      alert('Failed to launch campaign');
      setCampaignStatus('Campaign failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🤖 AI Outreach Agent
          </h1>
          <p className="text-xl text-gray-600">
            Automated SMS, Voice Calls, and Email Outreach
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Upload Contacts</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excel/CSV File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {parseResult && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">
                    ✅ Valid Contacts: {parseResult.valid.length}
                  </p>
                </div>

                {parseResult.invalid.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-semibold">
                      ❌ Invalid Contacts: {parseResult.invalid.length}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-red-600">
                        View errors
                      </summary>
                      <ul className="mt-2 text-xs text-red-700 space-y-1">
                        {parseResult.invalid.slice(0, 5).map((item: any, i: number) => (
                          <li key={i}>
                            Row {item.row}: {item.errors.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}

                {parseResult.duplicates.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-semibold">
                      ⚠️ Duplicates Removed: {parseResult.duplicates.length}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">⚙️ Campaign Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template
                </label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Use {{firstName}}, {{name}}, and custom variables"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables: {'{'}firstName{'}'}, {'{'}name{'}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sales">Sales</option>
                  <option value="support">Support</option>
                  <option value="reminder">Reminder</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="timezones"
                  checked={respectTimezones}
                  onChange={(e) => setRespectTimezones(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="timezones" className="ml-2 text-sm text-gray-700">
                  Respect business hours (9 AM - 5 PM local time)
                </label>
              </div>

              <button
                onClick={handleLaunchCampaign}
                disabled={loading || !parseResult?.valid?.length}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '🔄 Processing...' : '🚀 Launch Campaign'}
              </button>
            </div>
          </div>
        </div>

        {campaignStatus && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📈 Campaign Progress</h2>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold">{campaignStatus}</p>
                {results.length > 0 && (
                  <p className="text-blue-600 text-sm mt-1">
                    Processed: {results.length} / {parseResult?.valid?.length || 0}
                  </p>
                )}
              </div>
            </div>

            {results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Contact</th>
                      <th className="text-left py-2 px-4">Channel</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{result.contactName}</td>
                        <td className="py-2 px-4">{result.channel}</td>
                        <td className="py-2 px-4">
                          {result.success ? (
                            <span className="text-green-600">✅ Success</span>
                          ) : (
                            <span className="text-red-600">❌ Failed</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-xs text-gray-600">
                          {result.error || result.message || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <footer className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            ⚡ Powered by Claude AI, Twilio, and Next.js
          </p>
        </footer>
      </div>
    </div>
  );
}
