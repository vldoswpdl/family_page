export function TravelGalleryPage() {
  const travelImages = [
    {
      src: '/travel/goseong-trip-1-corrected.png',
      alt: '고성 2박 3일 맛집과 바다놀이 여행 일정 수정 포스터',
      title: '여행 일정 포스터 1 · 날짜 수정본'
    },
    {
      src: '/travel/goseong-trip-2-corrected.png',
      alt: '라이언과 어피치 고성 2박 3일 가족 여행 수정 포스터',
      title: '여행 일정 포스터 2 · 오탈자 수정본'
    }
  ];

  return (
    <>
      <section className="hero-card">
        <div>
          <p className="hero-kicker">Travel Gallery</p>
          <h1>26년 고성</h1>
          <p className="hero-copy">26년 5/1(금)~5/3(일), 아야진 스테이</p>
        </div>
        <div className="hero-side">
          <span className="hero-label">5/1(금) ~ 5/3(일) · 아야진 스테이</span>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h2>고성 아야진 스테이 2박 3일 여행 이미지</h2>
          </div>
        </div>

        <div className="travel-gallery-grid">
          {travelImages.map((image) => (
            <figure key={image.src} className="travel-figure">
              <div className="travel-image-frame">
                <img src={image.src} alt={image.alt} className="travel-image" />
              </div>
              <figcaption>{image.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
