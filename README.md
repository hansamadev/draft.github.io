# Draft Yönetim Paneli

Apple ilhamlı, premium karanlık temaya sahip profesyonel Football Snake Draft yönetim uygulaması.
Tamamen HTML, CSS ve Vanilla JavaScript ile geliştirilmiş olup herhangi bir veritabanı, arka plan servisi veya framework gerektirmez.

## Özellikler

- **Modern Premium Tasarım**: Glassmorphism (buzlu cam efekti), akıcı animasyonlar, özel parçacık (particle) arka planı, geniş ve ferah arayüz.
- **Snake Draft Motoru**: İlk tur rastgele kuraya göre başlar. İkinci turda sıra tersine döner. Sonraki turlarda bu şekilde yılan (snake) mantığında ilerler.
- **Takım Yönetimi**: İstenilen sayıda takım oluşturma, takımlara özel renk belirleme ve bütçe atama.
- **Canlı Draft Paneli**:
  - Aktif olan takım oyuncuyu belirler.
  - Transfer için sözlü pazarlık sonlandıktan sonra "Teklifler Bitti" butonuna basılır.
  - Oyuncunun hangi takıma gideceği ve bedeli seçilir.
- **Kadro Sınırı**: Her takım için maksimum 18 oyuncu limiti vardır.
- **Transfer Geri Alma (Undo)**: Son yapılan yanlış bir transferi anında geri alabilir, takımın bütçesini iade edebilirsiniz.
- **Yerel Depolama (localStorage)**: Sayfa yenilense bile draft süreci kaybolmaz, kaldığınız yerden devam edebilirsiniz.
- **Sonuçları Dışa Aktarma**: Draft bittiğinde oluşturulan kadroları ve bütçeleri `.txt` dosyası olarak bilgisayarınıza indirebilirsiniz.

## Kurulum ve Kullanım

Projeyi çalıştırmak için herhangi bir sunucu kurmanıza gerek yoktur:
1. Proje dosyalarını indirin.
2. `index.html` dosyasına çift tıklayarak tarayıcınızda açın.
3. **Yeni Takım Ekle** bölümünden takımlarınızı oluşturun ve renk/bütçe ayarlarını yapın.
4. **Draft Başlat** butonuna basarak kura çekimini gerçekleştirin.
5. Kurayı onaylayıp **Drafta Geç** diyerek draft kontrol paneline ulaşın.
6. Sözlü pazarlıklar sonucu satılan oyuncuları panelden ilgili takımlara atayın.

## Teknolojiler
- HTML5
- CSS3 (Vanilla, Değişkenler, Flexbox & Grid)
- JavaScript (ES6+, DOM Manipulation, LocalStorage)

## Dil ve Kod Yapısı
Kullanıcı arayüzü tamamen **Türkçe**, kod blokları ve fonksiyon yorum satırları geliştirme kolaylığı açısından **İngilizce** tasarlanmıştır. Herhangi bir dış kütüphane kullanılmamıştır.
