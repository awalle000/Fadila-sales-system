import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © {currentYear} Soap Shop Sales System. All rights reserved.
        </p>
        <p className="footer-subtext">
          Powered by React & MongoDB | Currency: Ghana Cedis (GH₵)
        </p>
      </div>
    </footer>
  );
};

export default Footer;