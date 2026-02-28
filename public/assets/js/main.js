// ============================================
// Amna Suraka Museum - Dynamic Slides Loader
// ============================================

// Global state
let allSlides = [];
let slideNumber = 0;
let playSlider;
const SLIDE_DURATION = 8500; // 8.5 seconds per slide

// Detect current language
function getCurrentLanguage() {
  const htmlTag = document.getElementById('main-html');
  const lang = htmlTag ? htmlTag.getAttribute('lang') : 'en';
  return lang === 'ku' ? 'kr' : 'en';
}

// Fetch slides from Supabase
async function fetchSlides() {
  try {
    // Check if Supabase is configured
    if (typeof supabaseClient === 'undefined') {
      console.log('Supabase not configured, using fallback data');
      return getFallbackSlides();
    }

    const { data, error } = await supabaseClient
      .from('slides')
      .select('*')
      .eq('is_active', true)
      .order('slide_number', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      return data;
    }

    return getFallbackSlides();
  } catch (error) {
    console.error('Error fetching slides:', error);
    return getFallbackSlides();
  }
}

// Fallback slides data (for demo mode)
function getFallbackSlides() {
  const lang = getCurrentLanguage();
  return [
    { slide_number: 1, title: 'Red Prison', title_kr: 'ئەمنە سورەکە', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'Statue of dictator Saddam Hussein', description_kr: 'پەیکەری دیکتاتۆر سەدام حوسێن', background_image: 'assets/images/bg-1.jpg', museum_image: 'assets/images/saddam2.png', video_url: 'assets/videos/peshmarga.mp4' },
    { slide_number: 2, title: 'Peshmarga', title_kr: 'پێشمەرگە', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'Peshmerga is an ambassador of generosity and love', description_kr: 'پێشمەرگە باڵویزی بەخشندەی و خۆشەویستی', background_image: 'assets/images/bg-2.jpg', museum_image: 'assets/images/peshmarga.png', video_url: 'assets/videos/peshmarga.mp4' },
    { slide_number: 3, title: 'Cinema', title_kr: 'سینەما', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: '', description_kr: 'سینەمای یەڵماز گونەی', background_image: 'assets/images/bg-3.jpg', museum_image: 'assets/images/cinema.png', video_url: 'assets/videos/cinema.mp4' },
    { slide_number: 4, title: 'Kurdish Heritage', title_kr: 'کلتور', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'cultural and heritage museum', description_kr: 'شێخ مەحمود یەکەم مەلیکی کوردوستان', background_image: 'assets/images/bg-4.jpg', museum_image: 'assets/images/malikshekhmahmud.png', video_url: 'assets/videos/Malikshexmahmud.mp4' },
    { slide_number: 5, title: 'Prisons', title_kr: 'زیندانیان', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'These jails remained intact', description_kr: 'ئەم بەشە تایبەت بووە بۆ هەڵواسین', background_image: 'assets/images/bg-5.jpg', museum_image: 'assets/images/zindanyakan.png', video_url: 'assets/videos/zindanakan.mp4' },
    { slide_number: 6, title: 'Mine Museum', title_kr: 'مین و تەقەمەنی', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'dedicated to displaying all types of mines', description_kr: 'ئەم بەشە تایبەتە بە پیشاندان', background_image: 'assets/images/bg-6.jpg', museum_image: 'assets/images/minwtaqamany.png', video_url: 'assets/videos/Min-taqmany.mp4' },
    { slide_number: 7, title: 'Exodus', title_kr: 'کۆڕەو', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'After the 1991 spring uprising', description_kr: 'دوای ڕاپەڕینی بەهاری ١٩٩١', background_image: 'assets/images/bg-koraw.jpg', museum_image: 'assets/images/koraw.png', video_url: 'assets/videos/koraw.mp4' },
    { slide_number: 8, title: 'Mirrors', title_kr: 'ئاوێنەکان', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: "It's walls are covered with 182,000 mirrors", description_kr: 'دویوارەکان ڕوپۆشکراووە بە ١٨٢،٠٠٠ پارچە ئاوێنە', background_image: 'assets/images/bg-awenakan.jpg', museum_image: 'assets/images/awenakan.png', video_url: 'assets/videos/awenakan.mp4' },
    { slide_number: 9, title: 'Martyrs of The War Against ISIS', title_kr: 'شەهیدانی داعش', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'In that unwanted war we represented the world', description_kr: 'لەو جەنگە نەخوازراوەدا نوێنەرایەتی جیهانمان کرد', background_image: 'assets/images/bg-isis.jpg', museum_image: 'assets/images/isis.png', video_url: 'assets/videos/isis.mp4' },
    { slide_number: 10, title: 'Exhibition Hall', title_kr: 'گەلەری', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'Gallery hall for exhibiting works', description_kr: 'هۆڵی گەلەری بۆ نمایشکردنی کاری هونەری', background_image: 'assets/images/bg-gallery.jpg', museum_image: 'assets/images/gallaery.png', video_url: 'assets/videos/gallery.mp4' },
    { slide_number: 11, title: 'Anfal', title_kr: 'ئەنفال', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'dedicated to displaying victims of Anfal', description_kr: 'تایبەتە بە نمایشکردنی ناو و وێنەی قوربانیان', background_image: 'assets/images/bg-anfal.jpg', museum_image: 'assets/images/anfal.png', video_url: 'assets/videos/anfal.mp4' },
    { slide_number: 12, title: 'Resistance', title_kr: 'خۆڕاگری', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'dedicated to political prisoners', description_kr: 'تایبەتە بە ناو وێنەی ئەو زیندانییە سیاسیانە', background_image: 'assets/images/bg-xoragry.jpg', museum_image: 'assets/images/xoragry.png', video_url: 'assets/videos/balganama.mp4' },
    { slide_number: 13, title: 'Heavy Weapons Square', title_kr: 'گۆڕەپانی چەکی قورس', subtitle: 'museum', subtitle_kr: 'مۆزەی', description: 'dedicated to displaying tanks and military vehicles', description_kr: 'تایبەتە بە نمایشکردنی ئەو تانک و تۆپ', background_image: 'assets/images/bg-gorapan.jpg', museum_image: 'assets/images/gorapan.png', video_url: 'assets/videos/red museum.mp4' }
  ];
}

// Generate slide HTML
function createSlideHTML(slide, index, isFirst = false) {
  const lang = getCurrentLanguage();
  const title = lang === 'kr' ? (slide.title_kr || slide.title) : slide.title;
  const subtitle = lang === 'kr' ? (slide.subtitle_kr || slide.subtitle) : slide.subtitle;
  const description = lang === 'kr' ? (slide.description_kr || slide.description) : slide.description;
  
  const firstClass = isFirst ? 'first-slide' : '';
  const activeClass = isFirst ? 'active' : '';
  
  return `
    <div class="slide ${firstClass}">
      <div class="slide-images">
        <img src="${slide.background_image}" alt="" class="slide-bg-img">
        ${slide.museum_image ? `<img src="${slide.museum_image}" alt="" class="slide-museum-image">` : ''}
        <h1 class="museum-name">${title} <br> <span class="museum-span">${subtitle}</span></h1>
      </div>
      <div class="slide-text-content">
        <h3 class="slide-caption">${lang === 'kr' ? 'تا لە یادمان نەچێت' : 'Not To Be Forgotten'}</h3>
        <p class="slide-paragraph">${description}</p>
        <button class="watch-video-btn">${lang === 'kr' ? 'بینینی ڤیدیۆ' : 'Watch video'}</button>
      </div>
      <div class="slider-video-modal">
        <i class="ri-close-line video-close-btn"></i>
        <div class="video-modal-content">
          <div class="video-card">
            <video src="${slide.video_url || ''}" class="musuem-video" controls></video>
            <p class="video-paragraph">${title}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Initialize slider with slides
function initializeSlider(slides) {
  const slider = document.querySelector('.slider');
  if (!slider) return;

  // Clear existing slides
  slider.innerHTML = '';

  // Add new slides
  slides.forEach((slide, index) => {
    slider.insertAdjacentHTML('beforeend', createSlideHTML(slide, index, index === 0));
  });

  // Generate pagination buttons
  const pagination = document.querySelector('.slide-pagination');
  if (pagination) {
    pagination.innerHTML = '';
    slides.forEach((_, index) => {
      const btnClass = index === 0 ? 'slide-btn first-slide-btn' : 'slide-btn';
      pagination.insertAdjacentHTML('beforeend', `<div class="${btnClass}"></div>`);
    });
  }

  // Generate indicator bars
  const indicatorBars = document.querySelector('.slide-indicator-bars');
  if (indicatorBars) {
    indicatorBars.innerHTML = '';
    slides.forEach((_, index) => {
      const barClass = index === 0 ? 'indicator-bar first-indicator-bar' : 'indicator-bar';
      indicatorBars.insertAdjacentHTML('beforeend', `<div class="${barClass}"></div>`);
    });
  }

  // Reinitialize slider functionality
  initSliderControls();
  
  // Start autoplay
  slideNumber = 0;
  const firstSlide = document.querySelector('.slide');
  const firstSlideBtn = document.querySelector('.slide-btn');
  const firstIndicator = document.querySelector('.indicator-bar');
  
  if (firstSlide) firstSlide.classList.add('active');
  if (firstSlideBtn) firstSlideBtn.classList.add('active');
  if (firstIndicator) firstIndicator.classList.add('active');
  
  repeater();
}

// Slider autoplay
var repeater = () => {
  const slides = document.querySelectorAll('.slide');
  const slideBtns = document.querySelectorAll('.slide-btn');
  const slideindicatorBars = document.querySelectorAll('.indicator-bar');
  const numberofslides = slides.length;
  
  if (playSlider) clearInterval(playSlider);
  
  playSlider = setInterval(function() {
    slides.forEach((slide) => {
      slide.classList.remove('active');
    });
    
    slideBtns.forEach((btn) => {
      btn.classList.remove('active');
    });
    
    slideindicatorBars.forEach((bar) => {
      bar.classList.remove('active');
    });
    
    slideNumber++;
    
    if (slideNumber > (numberofslides - 1)) {
      slideNumber = 0;
    }
    
    slides[slideNumber].classList.add('active');
    slideBtns[slideNumber].classList.add('active');
    slideindicatorBars[slideNumber].classList.add('active');
  }, SLIDE_DURATION);
};

// Initialize slider controls
function initSliderControls() {
  const slides = document.querySelectorAll('.slide');
  const slideBtns = document.querySelectorAll('.slide-btn');
  const slideindicatorBars = document.querySelectorAll('.indicator-bar');
  const numberofslides = slides.length;
  
  // Next button
  const nextBtn = document.querySelector('.next-btn');
  if (nextBtn) {
    nextBtn.onclick = function() {
      slides.forEach((slide) => slide.classList.remove('active'));
      slideBtns.forEach((btn) => btn.classList.remove('active'));
      slideindicatorBars.forEach((bar) => bar.classList.remove('active'));
      
      slideNumber++;
      if (slideNumber > (numberofslides - 1)) slideNumber = 0;
      
      slides[slideNumber].classList.add('active');
      slideBtns[slideNumber].classList.add('active');
      slideindicatorBars[slideNumber].classList.add('active');
      
      clearInterval(playSlider);
      repeater();
    };
  }
  
  // Previous button
  const prevBtn = document.querySelector('.prev-btn');
  if (prevBtn) {
    prevBtn.onclick = function() {
      slides.forEach((slide) => slide.classList.remove('active'));
      slideBtns.forEach((btn) => btn.classList.remove('active'));
      slideindicatorBars.forEach((bar) => bar.classList.remove('active'));
      
      slideNumber--;
      if (slideNumber < 0) slideNumber = numberofslides - 1;
      
      slides[slideNumber].classList.add('active');
      slideBtns[slideNumber].classList.add('active');
      slideindicatorBars[slideNumber].classList.add('active');
      
      clearInterval(playSlider);
      repeater();
    };
  }
  
  // Pagination buttons
  slideBtns.forEach((btn, i) => {
    btn.onclick = function() {
      slides.forEach((slide) => slide.classList.remove('active'));
      slideBtns.forEach((b) => b.classList.remove('active'));
      slideindicatorBars.forEach((bar) => bar.classList.remove('active'));
      
      slides[i].classList.add('active');
      slideBtns[i].classList.add('active');
      slideindicatorBars[i].classList.add('active');
      
      slideNumber = i;
      clearInterval(playSlider);
      repeater();
    };
  });
  
  // Video modals
  slides.forEach((slide, i) => {
    const watchVideoBtn = slide.querySelector('.watch-video-btn');
    const slideVideoModal = slide.querySelector('.slider-video-modal');
    const videoCloseBtn = slide.querySelector('.video-close-btn');
    const musuemVideo = slide.querySelector('.musuem-video');
    
    if (watchVideoBtn && slideVideoModal) {
      watchVideoBtn.onclick = function() {
        slideVideoModal.classList.add('active');
        setTimeout(() => {
          const videoModalContent = slide.querySelector('.video-modal-content');
          if (videoModalContent) videoModalContent.classList.add('active');
        }, 300);
        if (musuemVideo) musuemVideo.play();
        clearInterval(playSlider);
      };
    }
    
    if (videoCloseBtn && slideVideoModal) {
      videoCloseBtn.onclick = function() {
        slideVideoModal.classList.remove('active');
        const videoModalContent = slide.querySelector('.video-modal-content');
        if (videoModalContent) videoModalContent.classList.remove('active');
        if (musuemVideo) {
          musuemVideo.pause();
          musuemVideo.currentTime = 0;
        }
        clearInterval(playSlider);
        repeater();
      };
    }
  });
}

// ============================================
// Supabase Contact Form Integration
// ============================================

// Toast notification function
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="ri-${type === 'success' ? 'check-circle-fill' : 'error-warning-fill'}"></i>
      <span>${message}</span>
    </div>
  `;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background-color: ${type === 'success' ? '#10B981' : '#EF4444'};
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Add keyframe animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Contact form submission
document.addEventListener('DOMContentLoaded', function() {
  // Fetch and initialize slides
  fetchSlides().then(slides => {
    initializeSlider(slides);
  });

  // Contact form handler
  const contactForms = document.querySelectorAll('.contact-form');
  contactForms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        message: formData.get('message'),
        created_at: new Date().toISOString()
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        if (typeof supabaseClient === 'undefined') {
          console.log('Form data (Supabase not configured):', data);
          showToast('Message sent successfully! (Demo mode)', 'success');
          form.reset();
          return;
        }

        const { data: response, error } = await supabaseClient
          .from('messages')
          .insert([data]);

        if (error) throw error;

        showToast('Message sent successfully! Thank you.', 'success');
        form.reset();
      } catch (error) {
        console.error('Error submitting form:', error);
        showToast('Failed to send message. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  });

  // Counter animation
  function animateCounter(id, target, duration = 3500) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const start = 0;
    const increment = target / (duration / 10);
    let current = start;

    const counter = setInterval(() => {
      current += increment;
      element.textContent = Math.floor(current);

      if (current >= target) {
        clearInterval(counter);
        element.textContent = target;
      }
    }, 10);
  }

  animateCounter('archive-count', 1900);
  animateCounter('visitor-count', 900);
  animateCounter('museum-count', 11);

  // Navigation active state
  const list = document.querySelectorAll('.list');
  const sections = document.querySelectorAll('section');

  function removeActiveClasses() {
    list.forEach((item) => item.classList.remove('active'));
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');
          const activeButton = document.querySelector(
            `.slider-media-icons ul li a[href="#${sectionId}"]`
          );

          if (activeButton) {
            removeActiveClasses();
            activeButton.parentElement.classList.add('active');
          }
        }
      });
    },
    { threshold: 0.6 }
  );

  sections.forEach((section) => observer.observe(section));

  list.forEach((item) =>
    item.addEventListener('click', function() {
      removeActiveClasses();
      this.classList.add('active');
    })
  );
});
