import {Link} from 'react-router-dom';

const NotFoundPage = () => (
  <main role="alert" style={{padding: '3rem 1.5rem', textAlign: 'center'}}>
    <h1>Page not found</h1>
    <p>That URL is not a Coursistant screen.</p>
    <p><Link to="/">Back to home</Link></p>
  </main>
);

export default NotFoundPage;
