import { createClient } from "@/utils/supabase/server";
import { BookOpen, CheckCircle2, Bookmark, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user_books with relations to generate the dashboard
  let query = supabase.from('user_books').select('*, books(*, authors(*))');
  if (user) {
    query = query.eq('user_id', user.id);
  }
  const { data: userBooks } = await query;

  const reading = userBooks?.filter((ub: any) => ub.status === 'reading') || [];
  const planToRead = userBooks?.filter((ub: any) => ub.status === 'toread') || [];
  const finished = userBooks?.filter((ub: any) => ub.status === 'finished') || [];
  const dropped = userBooks?.filter((ub: any) => ub.status === 'abandoned') || [];

  const columns = [
    { id: 'reading', label: 'Currently Reading', icon: <Flame className="w-4 h-4 text-orange-500" />, items: reading },
    { id: 'plan', label: 'Plan to Read', icon: <Bookmark className="w-4 h-4 text-blue-500" />, items: planToRead },
    { id: 'finished', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, items: finished },
  ];
