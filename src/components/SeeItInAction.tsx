import './SeeItInAction.css'

// Made-up couple and numbers, labelled as an example. Never real guests or real couples.

export default function SeeItInAction() {
  return (
    <section className="landing-section" aria-labelledby="action-title">
      <div className="section-head">
        <h2 id="action-title">See it in action</h2>
        <p className="muted">One invitation, three views. This is an example, with a made-up couple.</p>
      </div>

      <div className="demo-grid">
        <figure className="demo">
          <div className="demo-card demo-card--invite">
            <span className="demo-tag">Example</span>
            <p className="demo-eyebrow">You’re invited</p>
            <p className="demo-names">Folake &amp; Kunle</p>
            <p className="demo-detail">Saturday, 14 March · 2:00 pm</p>
            <p className="demo-detail">The Garden Hall, Lagos</p>
            <div className="demo-reply" aria-hidden="true">
              <span className="demo-pill demo-pill--on">Joyfully accepting</span>
              <span className="demo-pill">Regretfully declining</span>
            </div>
          </div>
          <figcaption>
            <h3>What your guests see</h3>
            <p className="muted">Your invitation, on their phone. They reply in under a minute, with no account.</p>
          </figcaption>
        </figure>

        <figure className="demo">
          <div className="demo-card">
            <span className="demo-tag">Example</span>
            <p className="demo-eyebrow">Wedding day</p>
            <p className="demo-big">In 12 days</p>
            <dl className="demo-stats">
              <div><dt>Accepted</dt><dd>84</dd></div>
              <div><dt>Declined</dt><dd>9</dd></div>
              <div><dt>Waiting</dt><dd>31</dd></div>
            </dl>
            <div className="demo-split">
              <p className="demo-detail">Accepted, by side</p>
              <div className="demo-bar" role="img" aria-label="51 on one side, 33 on the other">
                <span style={{ width: '61%' }} />
              </div>
              <p className="demo-detail demo-detail--row"><span>Bride’s side 51</span><span>Groom’s side 33</span></p>
            </div>
          </div>
          <figcaption>
            <h3>What you see</h3>
            <p className="muted">Who is coming, who hasn’t replied, and which side of the family each reply came through.</p>
          </figcaption>
        </figure>

        <figure className="demo">
          <div className="demo-card">
            <span className="demo-tag">Example</span>
            <p className="demo-eyebrow">Gifts</p>
            <ul className="demo-gifts">
              <li><span>Cash gift</span><span className="muted">Straight to your bank account</span></li>
              <li><span>Aso-ebi</span><span className="muted">Guests choose their set and pay</span></li>
              <li><span>Wishlist</span><span className="muted">Electric kettle · Pressure cooker</span></li>
            </ul>
          </div>
          <figcaption>
            <h3>What guests can give</h3>
            <p className="muted">After replying, guests can send cash, buy aso-ebi or pick from your wishlist.</p>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
