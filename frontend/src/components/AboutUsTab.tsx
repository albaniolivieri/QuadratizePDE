import './AboutUsTab.css'

const PACKAGE_REPO = 'https://github.com/albaniolivieri/QuPDE'

export function AboutUsTab() {
  return (
    <div className="about-us">
      <section className="about-section">
        <h2>Contact</h2>
        <ul className="about-list">
          <li>
            <strong>Email:</strong>{' '}
            <a href="mailto:a1olivieri@ucsd.edu">a1olivieri@ucsd.edu</a>
          </li>
          <li>
            <strong>GitHub:</strong>{' '}
            <a href="https://github.com/albaniolivieri" target="_blank" rel="noopener noreferrer">
              github.com/albaniolivieri
            </a>
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Citations</h2>
        <p>If this tool is useful for your research, please cite the following works:</p>
        <div className="citation-block">
          <h3>Paper</h3>
          <p className="citation">
            Olivieri A., Pogudin G., Kramer B. (2026). Quadratization of Autonomous Partial Differential Equations: Theory and Algorithms. arXiv preprint:{' '}
            <a href="https://arxiv.org/abs/2602.22371" target="_blank" rel="noopener noreferrer">
              arxiv:2602.22371
            </a>
          </p>
        </div>
        <div className="citation-block">
          <h3>Code</h3>
          <p className="citation">
            Albani Olivieri, & Gleb Pogudin. (2026). albaniolivieri/QuPDE: v0.1.1 (v0.1.1). Zenodo. {' '}
            <a href="https://doi.org/10.5281/zenodo.18750665" target="_blank" rel="noopener noreferrer">
              https://doi.org/10.5281/zenodo.18750665
            </a>
          </p>
        </div>
      </section>

      <section className="about-section">
        <h2>Software package</h2>
        <p>
          This website uses the <strong>QuPDE</strong> library for quadratization.
        </p>
        <a
          href={PACKAGE_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="about-repo-link"
        >
          {PACKAGE_REPO}
        </a>
      </section>
    </div>
  )
}
