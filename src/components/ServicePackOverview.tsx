import React from 'react';
import './ServicePackOverview.css';

const releases = [
  {
    label: 'Windows 10 1607',
    eol: 'EOL Oct’2026',
    quarters: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
  },
  {
    label: 'Windows 10 1809',
    eol: 'EOL Jan’2029',
    quarters: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
  },
  {
    label: 'Windows 10 2021',
    eol: 'EOL Jan’2032',
    quarters: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
  },
  {
    label: 'Windows 11 2024',
    eol: 'EOL Oct’2034',
    note: 'per quarter post Elua RFD',
    quarters: [],
  },
  {
    label: 'Future OS Releases',
    eol: 'Per quarter as applicable',
    quarters: [],
  },
];

const highlights = [
  'Follow a 90 days release cadence',
  'Be released per OS version until the OS EOL',
  'Mandatorily contain Microsoft patches',
  'Includes pre-planned security fixes & minor enhancements',
  'Obsolesce will not be handled via SP',
];

const ServicePackOverview: React.FC = () => (
  <section className="overview-panel overview-panel--strategy">
    <div className="overview-header">
      <h2>Service pack release Strategy</h2>
    </div>

    <div className="strategy-layout">
      <div className="strategy-chart">
        {releases.map((release) => (
          <div key={release.label} className="strategy-row">
            <div className="strategy-left">
              <div className="strategy-block">
                <span className="strategy-title">{release.label}</span>
                <span className="strategy-eol">{release.eol}</span>
              </div>
            </div>
            <div className="strategy-right">
              {release.quarters.length > 0 ? (
                <div className="strategy-quarters">
                  {release.quarters.map((quarter) => (
                    <span key={quarter} className="strategy-quarter">
                      {quarter}
                    </span>
                  ))}
                </div>
              ) : (
                (release.note || release.eol) ? <div className="strategy-note-box">{release.note || release.eol}</div> : null
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="strategy-summary">
        <div className="summary-card">
          <h3>Service pack will</h3>
          <ul>
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    <div className="strategy-footnote">
      SP* - Service Pack, OS* - Operating System, EOL* - End of Life
    </div>
  </section>
);

export default ServicePackOverview;
