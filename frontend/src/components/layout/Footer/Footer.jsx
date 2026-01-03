import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © {currentYear} Fadila Enterprise. All rights reserved.
        </p>
        <p className="footer-subtext">
          Powered by React & MongoDB | Currency: Ghana Cedis (GH₵) <br/>
          Developed by Taudjudeen || 0539228560
        </p>
      </div>
    </footer>
  );
};

export default Footer;