export const ENIGMA_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enigma '26 — Core Team</title>
  <style>
    body { margin:0; background:#f4f0e8; color:#20242b; font-family:Arial, Helvetica, sans-serif; }
    .email-shell { width:100%; padding:28px 14px; box-sizing:border-box; }
    .email-card { max-width:680px; margin:0 auto; background:#0c0d10; border-radius:20px; overflow:hidden; }
    .hero { padding:38px 24px; text-align:center; background:#11141c; }
    .hero img { width:160px; max-width:80%; height:auto; display:block; margin:auto; }
    .content { padding:34px 28px 40px; text-align:center; }
    .intro { margin:0 auto 30px; max-width:560px; color:#e0e1e5; font-size:16px; line-height:1.65; }
    .eyebrow { margin:0 0 18px; color:#d8aa52; font-size:13px; letter-spacing:.16em; text-transform:uppercase; font-weight:700; }
    .grid { display:table; width:100%; table-layout:fixed; border-spacing:10px; margin:-10px; }
    .grid-row { display:table-row; }
    .grid-cell { display:table-cell; width:50%; padding:18px; background:#17191f; border:1px solid #252934; border-radius:12px; vertical-align:top; text-align:left; }
    .grid-cell h3 { margin:0 0 12px; color:#d8aa52; font-size:16px; }
    .grid-cell p { margin:0; color:#d8d9dd; font-size:14px; line-height:1.8; }
    .core-title { margin:34px 0 14px; color:#d8aa52; font-size:18px; }
    .core { width:100%; border-collapse:collapse; color:#d8d9dd; font-size:14px; line-height:1.8; }
    .core td { width:50%; padding:4px 8px; text-align:left; }
    @media only screen and (max-width:480px) {
      .email-shell { padding:12px 8px; }
      .hero { padding:26px 18px; }
      .content { padding:28px 15px 30px; }
      .grid, .grid-row, .grid-cell { display:block; width:auto; }
      .grid-cell { margin:10px 0; }
      .core td { display:block; width:auto; padding:3px 0; }
    }
  </style>
</head>
<body>
  <div class="email-shell">
    <div class="email-card">
      <div class="hero"><img src="assets/enigma-logo.jpeg" width="160" height="162" alt="Enigma logo" loading="eager"></div>
      <div class="content">
        <p class="eyebrow">Welcoming Enigma '26</p>
        <p class="intro">As Enigma steps into a new year and begins its next chapter, we are thrilled to introduce the newly appointed sub-leads and core team members who will drive our vision forward for Enigma '26.</p>
        <p class="eyebrow">Sub-Leads</p>
        <div class="grid">
          <div class="grid-row"><div class="grid-cell"><h3>Tech</h3><p>Aditya Seethamraju<br>Aman Jafi<br>Johnston Purathoor Saji</p></div><div class="grid-cell"><h3>Research</h3><p>Shreyas Parthaje<br>Nishad Hubert<br>Johana Mary Kuruvilla<br>Pranav Sandeep</p></div></div>
          <div class="grid-row"><div class="grid-cell"><h3>Operations</h3><p>Armaan Choudhury<br>Ria Anne Francis<br>Ishita Sreedhar</p></div><div class="grid-cell"><h3>PR</h3><p>Lerissa Linson<br>Ruturaj Sonar<br>Rayhaan Libish</p></div></div>
          <div class="grid-row"><div class="grid-cell"><h3>Design</h3><p>Elza Rose Wilson</p></div><div class="grid-cell" aria-hidden="true"></div></div>
        </div>
        <p class="core-title">Core Team Members</p>
        <table class="core"><tr><td>Alen Alex</td><td>Christopher George</td></tr><tr><td>Rohan Satheesh</td><td>Surya K</td></tr><tr><td>Sheetal Pradeep</td><td>Ameen Sarvar</td></tr><tr><td>Naman Divgi</td><td>Mohd Arshal Ali</td></tr><tr><td>Dharun Karthikeyan</td><td>Mikel Bonny</td></tr><tr><td>T Madhuravel</td><td>Abishek S P</td></tr><tr><td>Neha George</td><td>Ashwin Manoj</td></tr><tr><td>Pujitha</td><td>Raj Kumar</td></tr></table>
      </div>
    </div>
  </div>
</body>
</html>`;

export const SAVED_TEMPLATES = [{ id: "enigma-26", name: "Enigma '26", description: "Sub-leads and core team welcome" , html: ENIGMA_TEMPLATE }];
