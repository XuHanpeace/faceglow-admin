// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Textarea, Button } from '@/components/ui';
// @ts-ignore;
import { MessageSquare } from 'lucide-react';

export function OrderNotes({
  notes,
  onAddNote
}) {
  const [note, setNote] = React.useState('');
  const handleAddNote = () => {
    if (note.trim()) {
      onAddNote(note);
      setNote('');
    }
  };
  return <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500">
        <CardTitle className="text-white flex items-center">
          <MessageSquare className="mr-2" size={20} />
          订单备注
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {notes && <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
              <p className="text-sm text-slate-700">{notes}</p>
            </div>}
          <div className="flex space-x-3">
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="添加订单备注..." rows={3} className="flex-1 rounded-xl border-slate-200 focus:border-green-500 focus:ring-green-500" />
            <Button onClick={handleAddNote} className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-xl px-6">
              添加
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
}