
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, X, PlusCircle, Trash2, Shield, Eye, Youtube, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import type { Instruction, UserAccess } from '@/types/instruction';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type InstructionEditorProps = {
    initialInstruction: Instruction;
    allUsers: { id: string, name: string, avatar: string }[];
};

export default function InstructionEditor({ initialInstruction, allUsers }: InstructionEditorProps) {
  const router = useRouter();
  const [instruction, setInstruction] = React.useState<Instruction>(initialInstruction);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleContentChange = () => {
    if (editorRef.current && instruction) {
      setInstruction({ ...instruction, content: editorRef.current.innerHTML });
    }
  };

  const handleAddMedia = (type: 'image' | 'video') => {
    const url = prompt(type === 'image' ? 'Вставте URL зображення:' : 'Вставте URL YouTube відео:');
    if (!url) return;

    let embedHtml = '';
    if (type === 'image') {
        embedHtml = `<img src="${url}" alt="Зображення" >`;
    } else {
        const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId) {
            embedHtml = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        } else {
            alert('Неправильне посилання на YouTube відео.');
            return;
        }
    }
    document.execCommand('insertHTML', false, embedHtml);
  };

  if (!isClient) return <div>Завантаження редактора...</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-muted/40">
      <header className="flex-shrink-0 bg-background border-b p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/instructions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input 
            value={instruction.title}
            onChange={(e) => setInstruction({ ...instruction, title: e.target.value })}
            className="text-lg font-bold tracking-tight font-headline border-none shadow-none p-0 h-auto focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/instructions')}>
            <X className="mr-2 h-4 w-4" /> Скасувати
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" /> Зберегти
          </Button>
        </div>
      </header>
      
      <main className="flex-1 grid grid-cols-12 gap-6 p-4 md:p-6 overflow-y-auto">
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => document.execCommand('bold')}><span className="font-bold">B</span></Button>
                    <Button size="sm" variant="outline" onClick={() => document.execCommand('italic')}><span className="italic">I</span></Button>
                    <Button size="sm" variant="outline" onClick={() => document.execCommand('underline')}>U</Button>
                    <Button size="sm" variant="outline" onClick={() => document.execCommand('insertUnorderedList')}>&bull;</Button>
                    <Button size="sm" variant="outline" onClick={() => document.execCommand('insertOrderedList')}>1.</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddMedia('image')}><ImageIcon className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleAddMedia('video')}><Youtube className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleContentChange}
                        className="prose dark:prose-invert max-w-none w-full min-h-[400px] p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        dangerouslySetInnerHTML={{ __html: instruction.content }}
                    />
                </CardContent>
            </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Доступи</CardTitle>
                    <CardDescription>Керуйте, хто може бачити та редагувати цю інструкцію.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {instruction.accessList.map(user => (
                        <div key={user.userId} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select 
                                    value={user.access}
                                    onValueChange={(value: 'view' | 'edit') => {
                                        const updatedList = instruction.accessList.map(u => u.userId === user.userId ? {...u, access: value} : u);
                                        setInstruction({...instruction, accessList: updatedList });
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[120px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="view"><div className="flex items-center gap-1"><Eye className="h-3 w-3" />Перегляд</div></SelectItem>
                                        <SelectItem value="edit"><div className="flex items-center gap-1"><Shield className="h-3 w-3" />Редактор</div></SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Додати користувача
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Додати доступ</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Label>Оберіть співробітника</Label>
                                <Command>
                                    <CommandInput placeholder="Пошук..." />
                                    <CommandList>
                                        <CommandEmpty>Не знайдено.</CommandEmpty>
                                        <CommandGroup>
                                            {allUsers.map(user => (
                                                <CommandItem key={user.id}>{user.name}</CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </div>
                            <DialogFooter>
                                <Button>Додати</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
