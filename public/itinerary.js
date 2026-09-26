(function () {
  const currentScript = document.currentScript;
  const clientId = currentScript ? currentScript.getAttribute('data-client-id') : null;
  
  if (!clientId) {
    console.error('Shield AI Itinerary: data-client-id is missing.');
    return;
  }

  const hostUrl = new URL(currentScript.src).origin;

  const style = document.createElement('style');
  style.innerHTML = `
    #shield-iti-wrapper {
      position: fixed;
      bottom: 96px;
      right: 20px;
      z-index: 999998;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #shield-iti-launcher {
      background: #000;
      color: #fff;
      border: none;
      padding: 12px 20px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #shield-iti-launcher:hover {
      transform: scale(1.05);
    }
    #shield-iti-modal {
      display: none;
      position: absolute;
      bottom: 0;
      right: 0;
      width: 380px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      border: 1px solid #eaeaea;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
    }
    @media (max-width: 480px) {
      #shield-iti-wrapper {
        bottom: 96px;
        right: 16px;
      }
      #shield-iti-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        max-height: 100vh;
        border-radius: 0;
        border: none;
      }
    }
    .shield-iti-header {
      background: #000;
      color: #fff;
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .shield-iti-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .shield-iti-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    .shield-iti-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .shield-iti-row {
      display: flex;
      gap: 12px;
    }
    .shield-iti-field {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .shield-iti-field label {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
    .shield-iti-input {
      padding: 10px 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s;
      background: #fff;
      color: #000;
    }
    .shield-iti-input:focus {
      border-color: #000;
    }
    .shield-iti-btn {
      background: #000;
      color: #fff;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 600;
      margin-top: 8px;
      width: 100%;
      transition: opacity 0.2s;
    }
    .shield-iti-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .shield-iti-result {
      display: none;
      font-size: 14px;
      color: #333;
    }
    .shield-iti-result h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    .shield-iti-result p {
      margin: 0 0 16px 0;
      line-height: 1.5;
    }
    .shield-iti-day {
      margin-top: 16px;
      border-left: 3px solid #000;
      padding-left: 12px;
    }
    .shield-iti-day strong {
      display: block;
      margin-bottom: 4px;
    }
    .shield-iti-day ul {
      margin: 0;
      padding-left: 16px;
      color: #444;
    }
    .shield-iti-day li {
      margin-bottom: 4px;
    }
    .shield-iti-wa {
      display: block;
      background: #25D366;
      color: #fff;
      text-align: center;
      padding: 12px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 24px;
      transition: opacity 0.2s;
    }
    .shield-iti-wa:hover {
      opacity: 0.9;
    }
    .shield-iti-restart {
      background: none;
      border: 1px solid #ccc;
      color: #333;
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Fetch configuration
  let config = {
    branding: {
      primaryColor: '#000000',
      itineraryTitle: 'Plan Your Trip',
      itineraryLauncherText: 'Plan My Trip'
    }
  };

  fetch(`${hostUrl}/api/widget-config?clientId=${clientId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.error && data.itineraryEnabled !== false) {
        config = { ...config, ...data };
        updateBranding();
      } else if (data.itineraryEnabled === false) {
        document.getElementById('shield-iti-wrapper').style.display = 'none';
      }
    })
    .catch(() => { /* use defaults */ });

  const wrapper = document.createElement('div');
  wrapper.id = 'shield-iti-wrapper';
  
  wrapper.innerHTML = `
    <button id="shield-iti-launcher" style="background: ${config.branding.primaryColor}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      <span id="shield-iti-launcher-text">${config.branding.itineraryLauncherText}</span>
    </button>
    <div id="shield-iti-modal">
      <div class="shield-iti-header" style="background: ${config.branding.primaryColor}">
        <span id="shield-iti-title-text">${config.branding.itineraryTitle}</span>
        <button class="shield-iti-close" id="shield-iti-close">&times;</button>
      </div>
      <div class="shield-iti-body">
        <form class="shield-iti-form" id="shield-iti-form">
          <div class="shield-iti-field">
            <label>Name *</label>
            <input type="text" class="shield-iti-input" id="shield-iti-name" required />
          </div>
          <div class="shield-iti-row">
            <div class="shield-iti-field">
              <label>Phone</label>
              <input type="text" class="shield-iti-input" id="shield-iti-phone" />
            </div>
            <div class="shield-iti-field">
              <label>Email</label>
              <input type="email" class="shield-iti-input" id="shield-iti-email" />
            </div>
          </div>
          <div class="shield-iti-row">
            <div class="shield-iti-field">
              <label>Destination *</label>
              <input type="text" class="shield-iti-input" id="shield-iti-dest" required />
            </div>
            <div class="shield-iti-field">
              <label>Days *</label>
              <input type="number" class="shield-iti-input" id="shield-iti-days" required />
            </div>
          </div>
          <div class="shield-iti-row">
            <div class="shield-iti-field">
              <label>Travellers</label>
              <input type="number" class="shield-iti-input" id="shield-iti-pax" />
            </div>
            <div class="shield-iti-field">
              <label>Budget</label>
              <input type="text" class="shield-iti-input" id="shield-iti-budget" placeholder="e.g. $1000" />
            </div>
          </div>
          <div class="shield-iti-row">
            <div class="shield-iti-field">
              <label>Travel Date</label>
              <input type="date" class="shield-iti-input" id="shield-iti-date" />
            </div>
            <div class="shield-iti-field">
              <label>Interests</label>
              <input type="text" class="shield-iti-input" id="shield-iti-int" placeholder="e.g. Adventure" />
            </div>
          </div>
          <button type="submit" class="shield-iti-btn" id="shield-iti-submit">Generate Itinerary</button>
        </form>
        <div id="shield-iti-error" style="color:#dc2626; margin-top:12px; font-size:13px; display:none;"></div>
        <div class="shield-iti-result" id="shield-iti-result"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(wrapper);

  function updateBranding() {
    const launcher = document.getElementById('shield-iti-launcher');
    const header = document.querySelector('.shield-iti-header');
    const submitBtn = document.getElementById('shield-iti-submit');
    const launcherText = document.getElementById('shield-iti-launcher-text');
    const titleText = document.getElementById('shield-iti-title-text');
    
    if (launcher) launcher.style.background = config.branding.primaryColor;
    if (header) header.style.background = config.branding.primaryColor;
    if (submitBtn) submitBtn.style.background = config.branding.primaryColor;
    
    if (launcherText) launcherText.innerText = config.branding.itineraryLauncherText;
    if (titleText) titleText.innerText = config.branding.itineraryTitle;
    
    // Create new style block for dynamic day borders
    const dynamicStyle = document.createElement('style');
    dynamicStyle.innerHTML = ".shield-iti-day { border-left-color: " + config.branding.primaryColor + " !important; }";
    document.head.appendChild(dynamicStyle);
  }

  const launcher = document.getElementById('shield-iti-launcher');
  const modal = document.getElementById('shield-iti-modal');
  const closeBtn = document.getElementById('shield-iti-close');
  const form = document.getElementById('shield-iti-form');
  const btn = document.getElementById('shield-iti-submit');
  const resDiv = document.getElementById('shield-iti-result');
  const errDiv = document.getElementById('shield-iti-error');

  launcher.addEventListener('click', () => {
    launcher.style.display = 'none';
    modal.style.display = 'flex';
  });
  
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    launcher.style.display = 'flex';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('shield-iti-phone').value;
    const email = document.getElementById('shield-iti-email').value;
    if (!phone && !email) {
      errDiv.innerText = 'Please provide either a phone number or an email address.';
      errDiv.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Planning...';
    errDiv.style.display = 'none';
    resDiv.style.display = 'none';

    const payload = {
      clientId,
      name: document.getElementById('shield-iti-name').value,
      phone: phone,
      email: email,
      destination: document.getElementById('shield-iti-dest').value,
      days: Number(document.getElementById('shield-iti-days').value),
      travellers: Number(document.getElementById('shield-iti-pax').value),
      budget: document.getElementById('shield-iti-budget').value,
      interests: document.getElementById('shield-iti-int').value,
      travelDate: document.getElementById('shield-iti-date').value,
      source: 'Itinerary Widget'
    };

    try {
      const itiRes = await fetch(`${hostUrl}/api/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await itiRes.json();
      
      if (!itiRes.ok) {
        throw new Error(data.error || 'Failed to generate itinerary');
      }

      form.style.display = 'none';
      let html = `<h3>${data.title}</h3><p>${data.summary}</p>`;
      
      data.days.forEach(d => {
        html += `
          <div class="shield-iti-day">
            <strong>Day ${d.day}: ${d.title}</strong>
            <ul>
              ${d.activities.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        `;
      });
      html += `<p style="margin-top:20px; font-size:12px; color:#666; font-style:italic;">${data.note}</p>`;
      
      if (data.whatsapp) {
        const text = encodeURIComponent(`Hi, I'm interested in the ${payload.destination} itinerary for ${payload.days} days.`);
        html += `<a href="https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}?text=${text}" target="_blank" class="shield-iti-wa">Enquire on WhatsApp</a>`;
      }
      
      html += `<button class="shield-iti-restart" id="shield-iti-restart">Plan Another Trip</button>`;

      resDiv.innerHTML = html;
      resDiv.style.display = 'block';
      
      document.getElementById('shield-iti-restart').addEventListener('click', () => {
        resDiv.style.display = 'none';
        form.reset();
        form.style.display = 'flex';
      });

    } catch (err) {
      errDiv.innerText = err.message;
      errDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerText = 'Generate Itinerary';
    }
  });

})();