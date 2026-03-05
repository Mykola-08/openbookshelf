"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Globe, Lock, ArrowRightLeft } from "@/components/ui/icons";

export default function AddSourcePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "public_url" as "public_url" | "private_api"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Fallback for demo mode without auth
        // alert("Please login to save sources.");
        // Mock success for now since we build local-first feel
    }

    // Insert into Supabase
    const { error } = await supabase
      .from('user_sources')
      .insert({
        user_id: user?.id || '00000000-0000-0000-0000-000000000000', // Mock ID if no auth
        name: formData.name,
        type: formData.type,
        config: { url: formData.url },
        sync_mode: 'pull_only',
        trust_level: 'medium'
      });
    
    if (error) {
        console.error(error);
        alert("Failed to add source: " + error.message);
    } else {
        router.push("/connections");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Source</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. My Public Library"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
             <div className="grid grid-cols-2 gap-4">
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, type: 'public_url'})}
                 className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${formData.type === 'public_url' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
               >
                 <Globe className="w-6 h-6 mb-2" />
                 <span className="text-sm font-medium">Public OPDS/Web</span>
               </button>
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, type: 'private_api'})}
                 className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${formData.type === 'private_api' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
               >
                 <Lock className="w-6 h-6 mb-2" />
                 <span className="text-sm font-medium">Private API</span>
               </button>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details URL</label>
            <input 
              type="url" 
              required
              placeholder="https://flibusta.is/opds"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
            />
            <p className="mt-1 text-xs text-gray-500">
               Enter the OPDS feed URL or public profile link.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
