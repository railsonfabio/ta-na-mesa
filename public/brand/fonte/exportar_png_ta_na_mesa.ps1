using namespace System.Drawing
using namespace System.Drawing.Drawing2D

$ErrorActionPreference = 'Stop'
$source = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class BrandPng {
  static Color T = ColorTranslator.FromHtml("#BD4D2D"), K = ColorTranslator.FromHtml("#231F1C"),
    Cream = ColorTranslator.FromHtml("#FBF6EF"), Waiter = ColorTranslator.FromHtml("#694838"),
    Manager = ColorTranslator.FromHtml("#302E2D");

  static void Q(GraphicsPath p, ref PointF at, float cx, float cy, float x, float y) {
    var end = new PointF(x,y);
    p.AddBezier(at, new PointF(at.X + 2f*(cx-at.X)/3f,at.Y + 2f*(cy-at.Y)/3f),
      new PointF(x + 2f*(cx-x)/3f,y + 2f*(cy-y)/3f), end);
    at=end;
  }
  static void L(GraphicsPath p, ref PointF at, float x, float y) { var end=new PointF(x,y); p.AddLine(at,end); at=end; }
  static GraphicsPath Outline() {
    var p=new GraphicsPath(FillMode.Alternate); var a=new PointF(39,56);
    Q(p,ref a,47,48,67,44); L(p,ref a,186,22); Q(p,ref a,202,18,207,29);
    Q(p,ref a,211,37,203,49); Q(p,ref a,195,63,200,76); Q(p,ref a,203,83,214,85);
    Q(p,ref a,232,87,237,105); Q(p,ref a,239,111,237,120); L(p,ref a,216,207);
    Q(p,ref a,212,229,193,231); L(p,ref a,81,231); Q(p,ref a,61,230,58,211);
    L(p,ref a,54,189); Q(p,ref a,52,176,45,167); L(p,ref a,30,148);
    Q(p,ref a,22,137,20,123); L(p,ref a,15,106); Q(p,ref a,10,85,23,69);
    Q(p,ref a,29,61,39,56); p.CloseFigure();
    p.AddEllipse(59,64,136,136); return p;
  }
  static void Mark(Graphics g,float x,float y,float size,Color c) {
    var state=g.Save(); g.TranslateTransform(x,y); g.ScaleTransform(size/256f,size/256f);
    using(var b=new SolidBrush(c)) using(var p=Outline()) { g.FillPath(b,p); g.FillEllipse(b,201,28,40,40); g.FillEllipse(b,13,187,40,40); }
    g.Restore(state);
  }
  static void Text(Graphics g,string s,float x,float y,float size,Color c,bool centered=false) {
    using(var b=new SolidBrush(c)) using(var f=new Font("Arial",size,FontStyle.Bold,GraphicsUnit.Pixel))
    using(var fmt=new StringFormat(StringFormat.GenericTypographic)) {
      fmt.Alignment=centered ? StringAlignment.Center : StringAlignment.Near;
      g.DrawString(s,f,b,x,y,fmt);
    }
  }
  static void Render(string file,int pxW,int pxH,float unitsW,float unitsH,Action<Graphics> draw) {
    using(var bmp=new Bitmap(pxW,pxH,PixelFormat.Format32bppArgb)) using(var g=Graphics.FromImage(bmp)) {
      g.Clear(Color.Transparent); g.SmoothingMode=SmoothingMode.AntiAlias;
      g.InterpolationMode=InterpolationMode.HighQualityBicubic; g.PixelOffsetMode=PixelOffsetMode.HighQuality;
      g.TextRenderingHint=System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
      g.ScaleTransform(pxW/unitsW,pxH/unitsH); draw(g); bmp.Save(file,ImageFormat.Png);
    }
  }
  static void Icon(string dir,string name,Color bg) {
    Render(Path.Combine(dir,name),1024,1024,76,76,g=>{
      using(var b=new SolidBrush(bg)) g.FillRoundedRectangleCompat(b,0,0,76,76,14.44f);
      Mark(g,7,7,62,Color.White);
    });
  }
  static void Signature(string dir,string name,bool descriptor,bool reverse,bool vertical) {
    float w=vertical?680:1050,h=vertical?500:210;
    Render(Path.Combine(dir,name),vertical?1360:2100,vertical?1000:420,w,h,g=>{
      Color foreground=reverse?Color.White:K, accent=reverse?Color.White:T;
      if(vertical) {
        Mark(g,242,28,196,accent); Text(g,"Tá na Mesa",340,descriptor?258:273,76,foreground,true);
        if(descriptor) Text(g,"RESTAURANTES E DELIVERY",340,362,23,accent,true);
      } else {
        Mark(g,27,22,166,accent); Text(g,"Tá na Mesa",220,descriptor?37:55,84,foreground);
        if(descriptor) Text(g,"RESTAURANTES E DELIVERY",224,125,26,accent);
      }
    });
  }
  public static void Export(string directory) {
    Directory.CreateDirectory(directory);
    Render(Path.Combine(directory,"simbolo-terracota.png"),1024,1024,256,256,g=>Mark(g,0,0,256,T));
    Render(Path.Combine(directory,"simbolo-carvao.png"),1024,1024,256,256,g=>Mark(g,0,0,256,K));
    Render(Path.Combine(directory,"simbolo-branco.png"),1024,1024,256,256,g=>Mark(g,0,0,256,Color.White));
    Icon(directory,"icone-app-cliente.png",T); Icon(directory,"icone-app-garcom.png",Waiter); Icon(directory,"icone-app-gestao.png",Manager);
    Signature(directory,"assinatura-horizontal.png",true,false,false);
    Signature(directory,"assinatura-horizontal-sem-descritor.png",false,false,false);
    Signature(directory,"assinatura-horizontal-branca.png",true,true,false);
    Signature(directory,"assinatura-vertical.png",true,false,true);
    Signature(directory,"assinatura-vertical-sem-descritor.png",false,false,true);
    Signature(directory,"assinatura-vertical-branca.png",true,true,true);
    Render(Path.Combine(directory,"marca-dagua.png"),2200,460,1100,230,g=>{
      var faint=Color.FromArgb(27,K); Mark(g,25,20,170,faint); Text(g,"Tá na Mesa",230,52,91,faint);
    });
    Render(Path.Combine(directory,"avatar-redes.png"),1080,1080,1080,1080,g=>{
      g.Clear(Cream); using(var b=new SolidBrush(T)) g.FillEllipse(b,170,170,740,740);
      Mark(g,258,258,564,Color.White);
    });
    Render(Path.Combine(directory,"capa-apresentacao.png"),1920,1080,1920,1080,g=>{
      g.Clear(Cream); using(var b=new SolidBrush(T)) g.FillRectangle(b,0,0,20,1080);
      Mark(g,137,116,108,T); Text(g,"Tá na Mesa",273,139,58,K);
      Text(g,"Uma experiência à mesa.",140,382,92,K);
      Text(g,"Atendimento, pedidos e acompanhamento em tempo real.",144,525,31,T);
      Text(g,"RESTAURANTES E DELIVERY",144,875,23,K);
      Mark(g,1215,270,650,Color.FromArgb(23,T));
    });
    Render(Path.Combine(directory,"papel-timbrado.png"),1588,2246,794,1123,g=>{
      g.Clear(Color.White); Mark(g,58,53,58,T); Text(g,"Tá na Mesa",129,61,34,K);
      Text(g,"RESTAURANTES E DELIVERY",131,105,11,T);
      using(var p=new Pen(T,2)) g.DrawLine(p,58,153,736,153);
      Mark(g,321,420,390,Color.FromArgb(12,K));
      using(var p=new Pen(ColorTranslator.FromHtml("#D6C9BC"),1)) g.DrawLine(p,58,1049,736,1049);
      Text(g,"Tá na Mesa  |  Restaurantes e Delivery",58,1060,12,K);
    });
  }
}

public static class GraphicsExtensions {
  public static void FillRoundedRectangleCompat(this Graphics g, Brush b,float x,float y,float w,float h,float r) {
    using(var p=new GraphicsPath()) {
      p.AddArc(x,y,2*r,2*r,180,90); p.AddArc(x+w-2*r,y,2*r,2*r,270,90);
      p.AddArc(x+w-2*r,y+h-2*r,2*r,2*r,0,90); p.AddArc(x,y+h-2*r,2*r,2*r,90,90);
      p.CloseFigure(); g.FillPath(b,p);
    }
  }
}
'@
Add-Type -TypeDefinition $source -ReferencedAssemblies @([System.Drawing.Graphics].Assembly.Location, [System.Drawing.PointF].Assembly.Location, (Join-Path $PSHOME 'System.Private.Windows.Core.dll'), (Join-Path $PSHOME 'System.Private.Windows.GdiPlus.dll'))
$target = Join-Path $PSScriptRoot 'Ta_na_Mesa_Identidade_v1\png'
[BrandPng]::Export($target)
Get-ChildItem $target -File | Select-Object Name, Length
