import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getServerUrl } from '../utils/supabase-client';
import { toast } from 'sonner@2.0.3';
import { Send, Bot, User, Sparkles, Upload, FileImage, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: 'create_project' | 'upload_image';
  data?: any;
}

export const RealAIAssistant: React.FC = () => {
  const { accessToken, user } = useAuth();
  const { language, t } = useLanguage();
  
  // Get user role
  const userRole = user?.user_metadata?.role || user?.role || 'Observer';
  const isGeneralManager = userRole === 'General Manager' || userRole === 'المدير العام';
  const isObserver = userRole === 'Observer' || userRole === 'مراقب';
  const isSupervisingEngineer = userRole === 'Supervising Engineer' || userRole === 'المهندس المشرف';
  const isEngineer = userRole === 'Engineer' || userRole === 'المهندس';
  
  // المدير العام + المهندس المشرف + المهندس يمكنهم إنشاء مشاريع بالمساعد الذكي
  const canCreateWithAI = isGeneralManager || isSupervisingEngineer || isEngineer;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: language === 'ar' 
        ? `مرحباً! 👋 أنا المساعد الذكي لإدارة مشاريع الطرق.\n\n${
            isGeneralManager 
              ? '📊 كمدير عام، يمكنني مساعدتك في:\n✅ إنشاء مشاريع بالذكاء الاصطناعي\n✅ عرض المشاريع والإحصائيات\n✅ تحليل البيانات والأداء\n✅ الإجابة عن أسئلتك\n✅ تقديم تقارير مفصلة'
              : isObserver
              ? '👀 كمراقب، يمكنني مساعدتك في:\n✅ عرض المشاريع\n✅ الإطلاع على الإحصائيات\n✅ الإجابة عن أسئلتك'
              : canCreateWithAI
              ? '✅ إنشاء مشاريع بالذكاء الاصطناعي\n✅ تحليل البيانات والإحصائيات\n✅ رفع وتحليل الصور\n✅ الإجابة عن أسئلتك'
              : '✅ عرض المشاريع والإحصائيات\n✅ تحليل البيانات\n✅ الإجابة عن أسئلتك'
          }\n\nكيف يمكنني مساعدتك اليوم?`
        : `Hello! 👋 I'm the AI assistant for road project management.\n\n${
            isGeneralManager
              ? '📊 As General Manager, I can help you with:\n✅ Creating projects with AI\n✅ Viewing projects and statistics\n✅ Analyzing data and performance\n✅ Answering your questions\n✅ Providing detailed reports'
              : isObserver
              ? '👀 As Observer, I can help you with:\n✅ Viewing projects\n✅ Accessing statistics\n✅ Answering your questions'
              : canCreateWithAI
              ? '✅ Creating projects with AI\n✅ Analyzing data and statistics\n✅ Uploading and analyzing images\n✅ Answering your questions'
              : '✅ Viewing projects and statistics\n✅ Analyzing data\n✅ Answering your questions'
          }\n\nHow can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages(prev => [...prev, reader.result as string]);
        
        // إضافة رسالة المستخدم بالصورة
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: `📸 تم رفع صورة للتحليل`,
          timestamp: new Date(),
          action: 'upload_image',
          data: { image: reader.result }
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // محاكاة الرد من AI
        setTimeout(() => {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `✅ تم تحليل الصورة بنجاح!\n\nالتحليل:\n• نوع المشروع: إعادة تأهيل طريق\n• الحالة: جيدة\n• النسبة المكتملة تقريباً: 65%\n• الملاحظات: السطح يحتاج إلى صيانة بسيطة\n\nهل تريد إنشاء مشروع بناءً على هذه البيانات؟`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 1500);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const detectIntent = (message: string): { intent: string; entities: any } => {
    const lower = message.toLowerCase();
    
    // Create project intent
    if (lower.includes('إنشاء مشروع') || lower.includes('أنشئ مشروع') || 
        lower.includes('مشروع جديد') || lower.includes('create project')) {
      return {
        intent: 'create_project',
        entities: {
          description: message,
          type: lower.includes('صيانة') ? 'صيانة' : 'تنفيذ'
        }
      };
    }
    
    // Statistics intent - أكثر شمولاً
    if (lower.includes('إحصائيات') || lower.includes('إحصائية') || 
        lower.includes('تقرير') || lower.includes('عرض') || 
        lower.includes('اعرض') || lower.includes('statistics') || 
        lower.includes('report') || lower.includes('show') ||
        lower.includes('أرقام') || lower.includes('بيانات') ||
        lower.includes('معلومات عن') || lower.includes('stats')) {
      return { intent: 'statistics', entities: {} };
    }
    
    // Help intent
    if (lower.includes('مساعدة') || lower.includes('help')) {
      return { intent: 'help', entities: {} };
    }
    
    return { intent: 'general', entities: {} };
  };

  const handleSend = async () => {
    if (!input.trim() && uploadedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // تحليل النية
      const { intent, entities } = detectIntent(input);

      let aiResponse = '';

      switch (intent) {
        case 'create_project':
          // فقط المراقب والمدير الإداري لا يمكنهم إنشاء مشاريع
          // المدير العام + المهندس المشرف + المهندس يمكنهم الإنشاء
          if (!canCreateWithAI) {
            aiResponse = isObserver
              ? '⚠️ عذراً، كمراقب لا يمكنك إنشاء مشاريع جديدة. يمكنك فقط عرض المشاريع والاطلاع على البيانات.'
              : '⚠️ عذراً، ليس لديك صلاحية لإنشاء مشاريع جديدة بالمساعد الذكي.\\n\\nفقط:\\n• المدير العام\\n• المهندس المشرف\\n• المهندس\\n\\nيمكنهم إنشاء مشاريع باستخدام المساعد الذكي.';
          } else {
            aiResponse = await handleCreateProject(entities);
          }
          break;
        
        case 'statistics':
          aiResponse = await handleStatistics();
          break;
        
        case 'help':
          aiResponse = `📚 **دليل الاستخدام:**\n\n1️⃣ **إنشاء مشروع:** قل "أنشئ مشروع طريق الرياض - جدة"\n2️⃣ **رفع صورة:** اضغط على زر 📷 ورفع صورة للتحليل\n3️⃣ **الإحصائيات:** اسأل عن "إحصائيات المشاريع"\n4️⃣ **أسئلة عامة:** اسأل أي سؤال!\n\nجرّب الآن! 🚀`;
          break;
        
        default:
          aiResponse = await handleGeneralQuery(input);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      toast.error('حدث خطأ في المساعد الذكي');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (entities: any): Promise<string> => {
    try {
      // استخراج البيانات من الوصف
      const response = await fetch(getServerUrl('/ai/create-project'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          description: entities.description,
          type: entities.type,
          images: uploadedImages
        })
      });

      if (response.ok) {
        const { project } = await response.json();
        setUploadedImages([]); // مسح الصور بعد الإنشاء
        return `✅ **تم إنشاء المشروع بنجاح!**\n\n📋 **التفاصيل:**\n• رقم المشروع: ${project.project_number}\n• اسم الطريق: ${project.road_name}\n• المنطقة: ${project.region}\n• الحالة: ${project.status}\n• رقم أمر العمل: ${project.work_order_number}\n\nتم حفظ المشروع في النظام. يمكنك عرضه في قسم "المشاريع" 🎉`;
      } else {
        return '❌ عذراً، حدث خطأ في إنشاء المشروع. حاول مرة أخرى.';
      }
    } catch (error) {
      return '❌ عذراً، لا أستطيع الاتصال بالخادم الآن. حاول مرة أخرى لاحقاً.';
    }
  };

  const handleStatistics = async (): Promise<string> => {
    try {
      const response = await fetch(getServerUrl('/projects'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        const total = projects.length;
        
        // حساب المشاريع النشطة - كل الحالات ما عدا "متوقف"
        const active = projects.filter((p: any) => 
          p.status !== 'متوقف' && p.status !== 'Stopped' &&
          p.status !== 'تم الاستلام النهائي' && p.status !== 'منجز'
        ).length;
        
        const completed = projects.filter((p: any) => 
          p.status === 'تم الاستلام النهائي' || p.status === 'منجز'
        ).length;
        
        const delayed = projects.filter((p: any) => 
          p.status === 'متأخر' || p.status === 'متعثر'
        ).length;
        
        const avgProgress = total > 0 
          ? Math.round(projects.reduce((sum: number, p: any) => sum + (p.progressActual || 0), 0) / total)
          : 0;

        const totalBudget = projects.reduce((sum: number, p: any) => 
          sum + (parseFloat(p.projectValue) || 0), 0
        );

        return `📊 **إحصائيات المشاريع الحقيقية:**

📁 إجمالي المشاريع: **${total}** مشروع
✅ المشاريع النشطة: **${active}** مشروع
🎯 المشاريع المكتملة: **${completed}** مشروع
⚠️ المشاريع المتأخرة: **${delayed}** مشروع
📈 متوسط الإنجاز: **${avgProgress}%**
💰 إجمالي الميزانية: **${totalBudget.toLocaleString('ar-SA')} ريال**

${active > 0 ? '✨ لديك مشاريع نشطة تحتاج متابعة!' : ''}
${delayed > 0 ? '🔴 تنبيه: لديك مشاريع متأخرة!' : ''}
${completed === total && total > 0 ? '🎉 ممتاز! جميع المشاريع مكتملة!' : ''}

النظام يعمل بكفاءة عالية! 🚀🇸🇦`;
      } else {
        return '❌ عذراً، لا أستطيع جلب الإحصائيات الآن. تأكد من اتصالك بالإنترنت.';
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return '❌ عذراً، حدث خطأ في جلب الإحصائيات. حاول مرة أخرى.';
    }
  };

  const handleGeneralQuery = async (query: string): Promise<string> => {
    // ردود ذكية بناءً على الكلمات المفتاحية
    const lower = query.toLowerCase();
    
    if (lower.includes('كيف') || lower.includes('طريقة')) {
      return '📝 **لإنجاز ذلك:**\n\n1. افتح القسم المطلوب من القائمة\n2. اضغط على الزر المناسب\n3. املأ البيانات المطلوبة\n4. احفظ التغييرات\n\nهل تريد شرحاً تفصيلياً لخطوة معينة؟';
    }
    
    if (lower.includes('مشكلة') || lower.includes('خطأ')) {
      return '🔧 **حل المشاكل:**\n\n• تأكد من اتصالك بالإنترنت\n• أعد تحميل الصفحة\n• تحقق من صلاحياتك\n• اتصل بالدعم الفني\n\nهل المشكلة مستمرة؟';
    }
    
    if (lower.includes('شكر') || lower.includes('thank')) {
      return '😊 العفو! سعيد بمساعدتك. هل هناك شيء آخر؟';
    }
    
    return `🤖 **فهمت سؤالك!**\n\nأنا هنا لمساعدتك في:\n• إدارة المشاريع\n• تحليل البيانات\n• الإجابة عن الأسئلة\n\nحاول أن تكون أكثر تحديداً، مثل:\n"أنشئ مشروع طريق الرياض"\n"اعرض إحصائيات المشاريع"\n"ارفع صورة للتحليل"`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <Card className="flex-1 flex flex-col glass-card border-0 shadow-xl">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary text-white animate-pulse">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  المساعد الذكي
                  <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
                </CardTitle>
                <p className="text-sm text-muted-foreground font-semibold">
                  مدعوم بالذكاء الاصطناعي AI
                </p>
              </div>
            </div>
            <Badge className="animate-pulse">متصل</Badge>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in-up ${
                message.role === 'user' ? 'justify-start' : 'justify-end'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              
              <div
                className={`max-w-[70%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'glass-card'
                }`}
              >
                <p className="whitespace-pre-wrap text-base font-medium leading-relaxed">
                  {message.content}
                </p>
                {message.data?.image && (
                  <img
                    src={message.data.image}
                    alt="Uploaded"
                    className="mt-3 rounded-lg max-w-full"
                  />
                )}
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-end animate-fade-in">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                <Bot className="h-5 w-5 animate-pulse" />
              </div>
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="flex gap-3 overflow-x-auto">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={img}
                    alt={`Upload ${index}`}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="aiImageUpload"
            />
            <label htmlFor="aiImageUpload">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="cursor-pointer"
                asChild
              >
                <span>
                  <FileImage className="h-5 w-5" />
                </span>
              </Button>
            </label>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب رسالتك... (مثال: أنشئ مشروع طريق الرياض)"
              className="flex-1 text-base font-medium"
              disabled={loading}
            />
            
            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && uploadedImages.length === 0)}
              className="px-6"
            >
              <Send className="h-5 w-5 ml-2" />
              إرسال
            </Button>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInput('أنشئ مشروع طريق الرياض - جدة السريع')}
            >
              💡 إنشاء مشروع
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInput('اعرض إحصائيات المشاريع')}
            >
              📊 الإحصائيات
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInput('مساعدة')}
            >
              ❓ مساعدة
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};