import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, jsonBody } from './api';
import { useAuth } from './AuthContext';

function Avatar({ user, size = 'normal' }) {
  return user?.avatar
    ? <img className={`avatar avatar-${size}`} src={user.avatar} alt={`${user.name || 'User'} avatar`} />
    : <span className={`avatar avatar-${size} avatar-fallback`}>{user?.name?.[0]?.toUpperCase() || 'X'}</span>;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout(event) {
    event.preventDefault();
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <nav className="main-nav" aria-label="Main navigation">
          <Link className="brand" to="/">Blog App</Link>
          <Link to="/">Home</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user && <Link to="/profile">Profile</Link>}
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user ? (
            <button className="button button-logout" type="button" onClick={handleLogout}>Logout</button>
          ) : (
            <span className="header-actions">
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}

function Page({ children, className = '' }) {
  return <main className={`page ${className}`}>{children}</main>;
}

function ErrorMessage({ children }) {
  return children ? <p className="form-error" role="alert">{children}</p> : null;
}

function readImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    return Promise.reject(new Error('Please choose an image file.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.readAsDataURL(file);
  });
}

function GoogleSignInButton({ disabled, text, onCredential, onError }) {
  const containerRef = useRef(null);
  const callbacksRef = useRef({ onCredential, onError });
  callbacksRef.current = { onCredential, onError };
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return undefined;

    let script = document.getElementById('google-identity-services');
    let createdScript = false;
    let cancelled = false;

    function renderButton() {
      if (cancelled || !containerRef.current) return;
      const identity = window.google?.accounts?.id;
      if (!identity) {
        callbacksRef.current.onError(new Error('Google sign-in could not be loaded. Please try again.'));
        return;
      }

      identity.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) callbacksRef.current.onCredential(response.credential);
          else callbacksRef.current.onError(new Error('Google did not return an ID token.'));
        }
      });
      identity.renderButton(containerRef.current, {
        theme: 'filled_black',
        size: 'large',
        text,
        width: 400
      });
    }

    function handleScriptError() {
      callbacksRef.current.onError(new Error('Google sign-in could not be loaded. Please try again.'));
    }

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.id = 'google-identity-services';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        createdScript = true;
      }
      script.addEventListener('load', renderButton, { once: true });
      script.addEventListener('error', handleScriptError, { once: true });
      if (createdScript) document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener('load', renderButton);
      script?.removeEventListener('error', handleScriptError);
    };
  }, [clientId, text]);

  if (!clientId) {
    return (
      <button
        className="button button-google button-full"
        type="button"
        onClick={() => onError(new Error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to client/.env.'))}
      >
        {text === 'signup_with' ? 'Sign Up with Google' : 'Login with Google'}
      </button>
    );
  }

  return (
    <div className="google-signin-control">
      <div
        ref={containerRef}
        className="google-signin-button"
        aria-disabled={disabled}
        style={{ opacity: disabled ? 0.65 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
      />
      <span className="google-signin-label" aria-hidden="true">
        {text === 'signup_with' ? 'Sign Up with Google' : 'Login with Google'}
      </span>
    </div>
  );
}

function AuthPage({ mode }) {
  const { login, signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (values.avatar instanceof File && values.avatar.size > 0) {
        values.avatar = await readImage(values.avatar);
      } else if (values.avatar instanceof File) {
        values.avatar = '';
      }
      if (isSignup) await signup(values);
      else await login(values.email, values.password);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin(googleIdToken) {
    setError('');
    setBusy(true);
    try {
      await googleLogin(googleIdToken);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page className="auth-layout">
      <section className="auth-card">
        <h1>{isSignup ? 'Sign Up' : 'Login'}</h1>
        <form className="stack-form" onSubmit={handleSubmit}>
          {isSignup && <label>Name<input name="name" type="text" placeholder="Your name" autoComplete="name" required /></label>}
          <label>Email<input name="email" type="email" placeholder={isSignup ? '' : 'Enter email'} autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" placeholder={isSignup ? '' : 'Enter password'} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={isSignup ? 8 : undefined} required /></label>
          {isSignup && <label>Avatar (optional)<input name="avatar" type="file" accept="image/*" /></label>}
          <ErrorMessage>{error}</ErrorMessage>
          <button className="button button-purple button-full" type="submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Sign Up' : 'Login'}</button>
          <GoogleSignInButton
            disabled={busy}
            text={isSignup ? 'signup_with' : 'signin_with'}
            onCredential={handleGoogleLogin}
            onError={(requestError) => setError(requestError.message)}
          />
        </form>
      </section>
    </Page>
  );
}

function PostCard({ post, onDelete, dashboard = false }) {
  const { user } = useAuth();
  const authorName = typeof post.author === 'object' ? post.author?.name : 'XBlog member';
  const userId = user?.id || user?._id;
  const canEdit = user && (user.role === 'admin' || post.author?._id === userId || post.author === userId);
  const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-GB') : '';

  return (
    <article className={`post-card ${dashboard ? 'dashboard-post-card' : ''}`}>
      {!dashboard && <div className="post-card-meta"><strong>{authorName}</strong>{date && <time>{date}</time>}</div>}
      {post.image && <Link to={`/posts/${post._id}`} className="post-image-link"><img className="post-image" src={post.image} alt="" /></Link>}
      <div className="post-card-content">
        <Link className="post-title-link" to={`/posts/${post._id}`}><h2>{post.title}</h2></Link>
        {post.content && <p className="post-excerpt">{post.content}</p>}
        {post.tags?.length > 0 && <div className="tag-list">{post.tags.map((tag) => <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} className="tag">#{tag}</Link>)}</div>}
        <div className="post-card-footer">{!dashboard && <Link to={`/posts/${post._id}`} className="button button-purple button-read">Read More</Link>}<div className="post-counts"><span>❤️ {post.likes?.length || 0}</span><span>● {post.commentCount ?? post.comments?.length ?? 0}</span></div>
          {canEdit && dashboard && <div className="inline-actions"><Link className="button button-info-outline button-tiny" to={`/posts/${post._id}`}>View</Link><Link className="button button-outline button-tiny" to={`/posts/${post._id}/edit`}>Edit</Link>{onDelete && <form onSubmit={(event) => { event.preventDefault(); onDelete(post._id); }}><button className="button button-danger-outline button-tiny" type="submit">Delete</button></form>}</div>}
        </div>
      </div>
    </article>
  );
}

function FeedPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const location = useLocation();
  const [search, setSearch] = useState(new URLSearchParams(location.search).get('search') || '');
  const [tag, setTag] = useState(new URLSearchParams(location.search).get('tag') || '');
  const [submittedSearch, setSubmittedSearch] = useState(search);
  const [submittedTag, setSubmittedTag] = useState(tag);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const nextSearch = query.get('search') || '';
    const nextTag = query.get('tag') || '';
    setSearch(nextSearch);
    setTag(nextTag);
    setSubmittedSearch(nextSearch);
    setSubmittedTag(nextTag);
  }, [location.search]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
    if (submittedSearch.trim()) query.set('search', submittedSearch.trim());
    if (submittedTag.trim()) query.set('tags', submittedTag.trim().replace(/^#/, ''));
    api(`/posts${query.size ? `?${query}` : ''}`)
      .then((result) => { if (active) { setPosts(result); setError(''); } })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [submittedSearch, submittedTag]);

  async function deletePost(id) {
    try {
      await api(`/posts/${id}`, { method: 'DELETE', token });
      setPosts((current) => current.filter((post) => post._id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <Page>
      <section className="hero">
        <div className="hero-copy"><h1>Explore Posts</h1></div>
      </section>
      <section className="feed-section">
        <div className="section-heading"><div></div>
          <form className="search-form" onSubmit={(event) => { event.preventDefault(); setSubmittedSearch(search); setSubmittedTag(tag); }}>
            <label className="visually-hidden" htmlFor="search-posts">Search by keyword</label><input id="search-posts" name="search" value={search} onChange={(event) => { setSearch(event.target.value); setSubmittedSearch(event.target.value); }} placeholder="Search by keyword..." />
            <label className="visually-hidden" htmlFor="filter-tag">Filter by tags</label><input id="filter-tag" name="tag" value={tag} onChange={(event) => { setTag(event.target.value); setSubmittedTag(event.target.value.split(',').map((value) => value.trim()).filter(Boolean).join(',')); }} placeholder="Filter by tags (comma-separated)" />
          </form>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        {posts.length ? <div className="post-grid">{posts.map((post) => <PostCard key={post._id} post={post} onDelete={user ? deletePost : null} />)}</div> : !error && <p className="no-posts">No posts found.</p>}
      </section>
    </Page>
  );
}

function Protected({ children, admin = false }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/users/me/posts', { token }).then((result) => { if (active) setPosts(result); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [token]);

  async function deletePost(id) {
    try {
      await api(`/posts/${id}`, { method: 'DELETE', token });
      setPosts((current) => current.filter((post) => post._id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return <Page><div className="dashboard-heading"><div><h1>My Posts</h1></div><Link className="button button-purple" to="/posts/create">+ Create Post</Link></div>
    <ErrorMessage>{error}</ErrorMessage>
    {posts.length ? <div className="post-grid">{posts.map((post) => <PostCard key={post._id} post={post} onDelete={deletePost} dashboard />)}</div> : <p className="dashboard-empty-text">You have no posts yet.</p>}
  </Page>;
}

function PostFormPage({ edit = false }) {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ title: '', content: '', image: '', tags: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!edit) return undefined;
    let active = true;
    api(`/posts/${id}`, { token }).then((post) => {
      if (active) setValues({ title: post.title, content: post.content, image: post.image || '', tags: (post.tags || []).join(', ') });
    }).catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [edit, id, token]);

  function update(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  }
  async function updateImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await readImage(file);
      setValues((current) => ({ ...current, image }));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      title: values.title,
      content: values.content,
      image: values.image,
      tags: values.tags.split(',').map((value) => value.trim().replace(/^#/, '')).filter(Boolean)
    };
    try {
      const post = await api(edit ? `/posts/${id}` : '/posts', {
        method: edit ? 'PUT' : 'POST',
        token,
        body: jsonBody(payload)
      });
      navigate(`/posts/${post._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <Page className="form-page"><form className="editor-form post-editor-form" onSubmit={handleSubmit}>
      <h1 className="form-title">{edit ? 'Edit Post' : 'Create Post'}</h1>
      <label>Title<input name="title" value={values.title} onChange={update('title')} required /></label>
      <label>Content<textarea name="content" value={values.content} onChange={update('content')} rows="8" required /></label>
      <label>Tags (comma-separated)<input name="tags" value={values.tags} onChange={update('tags')} /></label>
      {edit && values.image && <label>Current Image<img className="current-image" src={values.image} alt="Current post" /></label>}
      <label>{edit ? 'Upload New Image' : 'Image'}<input name="image" type="file" accept="image/*" onChange={updateImage} /></label>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="form-actions"><button className="button button-purple" type="submit" disabled={busy}>{busy ? 'Saving…' : edit ? 'Update Post' : 'Create Post'}</button></div>
    </form></Page>;
}

function PostDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function refresh() {
    const [nextPost, nextComments] = await Promise.all([
      api(`/posts/${id}`, { token }),
      api(`/posts/${id}/comments`)
    ]);
    setPost(nextPost);
    setComments(nextComments);
  }

  useEffect(() => {
    let active = true;
    Promise.all([api(`/posts/${id}`, { token }), api(`/posts/${id}/comments`)])
      .then(([nextPost, nextComments]) => { if (active) { setPost(nextPost); setComments(nextComments); } })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [id, token]);

  async function likePost(event) {
    event.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api(`/posts/${id}/like`, { method: 'POST', token });
      await refresh();
    } catch (requestError) { setError(requestError.message); }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api(`/posts/${id}/comments`, { method: 'POST', token, body: jsonBody({ text: commentText }) });
      setCommentText('');
      await refresh();
    } catch (requestError) { setError(requestError.message); }
  }

  async function deleteComment(event, commentId) {
    event.preventDefault();
    try {
      await api(`/comments/${commentId}`, { method: 'DELETE', token });
      setComments((current) => current.filter((comment) => comment._id !== commentId));
    } catch (requestError) { setError(requestError.message); }
  }

  if (error && !post) return <Page><ErrorMessage>{error}</ErrorMessage><Link to="/">Return home</Link></Page>;
  if (!post) return <Page><p className="muted">Loading story…</p></Page>;

  const author = typeof post.author === 'object' ? post.author : null;
  return <Page className="detail-page">
    <article className="story">
      <h1>{post.title}</h1>
      {post.image && <img className="detail-image" src={post.image} alt="" />}
      <div className="story-byline"><Avatar user={author} size="small" /><div><strong>{author?.name || 'XBlog member'}</strong><span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span></div></div>
      <div className="story-content">{post.content}</div>
      <div className="story-tags">{post.tags?.map((tag) => <span key={tag} className="tag">#{tag}</span>)}</div>
      <div className="story-actions"><form onSubmit={likePost}><button className={`button ${post.likedByCurrentUser ? 'button-purple' : 'button-like-outline'}`} type="submit">{post.likedByCurrentUser ? 'Unlike' : 'Like'} ({post.totalLikes ?? post.likes?.length ?? 0})</button></form>
      </div>
    </article>
    <section className="comments-section"><div className="comments-heading"><p className="eyebrow">Join the conversation</p><h2>Comments <span>({comments.length})</span></h2></div>
      {user ? <form className="comment-form" onSubmit={addComment}><label className="visually-hidden" htmlFor="comment-text">Write a comment</label><input id="comment-text" name="text" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment..." required /><button className="button button-green" type="submit">Add Comment</button></form> : <p className="muted">Please <Link to="/login" className="text-link">log in</Link> to join the conversation.</p>}
      <ErrorMessage>{error}</ErrorMessage>
      {!comments.length && <p className="no-comments">No comments yet.</p>}
      <div className="comment-list">{comments.map((comment) => <article className="comment" key={comment._id}><Avatar user={comment.author} size="small" /><div className="comment-body"><div className="comment-meta"><strong>{comment.author?.name || 'XBlog member'}</strong><time>{new Date(comment.createdAt).toLocaleDateString()}</time></div><p>{comment.text}</p></div>{user && (user.role === 'admin' || comment.author?._id === (user.id || user._id)) && <form onSubmit={(event) => deleteComment(event, comment._id)}><button className="link-button danger-link" type="submit">Delete</button></form>}</article>)}</div>
    </section>
  </Page>;
}

function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api('/users/me', { token }).then((result) => { if (active) setProfile(result); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [token]);
  async function updateProfile(event) {
    event.preventDefault();
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const updated = await api('/users/me', { method: 'PUT', token, body: jsonBody(values) });
      setProfile((current) => ({ ...current, ...updated }));
      updateUser(updated);
    } catch (requestError) {
      setError(requestError.message);
    }
  }
  return <Page className="profile-page"><div className="profile-card"><Avatar user={profile || user} size="large" /><div className="profile-info"><h1>{profile?.name || user.name}</h1><p>{profile?.email || user.email}</p><strong>Total Posts: {profile?.postCount ?? '—'}</strong></div><form className="editor-form profile-editor" onSubmit={updateProfile}><label>Name<input name="name" defaultValue={profile?.name || user.name} required /></label><label>Avatar URL<input name="avatar" type="url" defaultValue={profile?.avatar || user.avatar || ''} /></label><ErrorMessage>{error}</ErrorMessage><div className="form-actions"><button className="button button-purple" type="submit">Update Profile</button></div></form></div>
  </Page>;
}

function AdminPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api('/posts').then((result) => { if (active) setPosts(result); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);
  async function deletePost(id) {
    try {
      await api(`/posts/${id}`, { method: 'DELETE', token });
      setPosts((current) => current.filter((post) => post._id !== id));
    } catch (requestError) { setError(requestError.message); }
  }
  return <Page className="admin-page"><section className="admin-panel"><h1>Admin Panel – All Posts</h1><ErrorMessage>{error}</ErrorMessage>{posts.length ? <div className="table-scroll"><table><thead><tr><th>Title</th><th>Author</th><th>Likes</th><th>Created</th><th>Actions</th></tr></thead><tbody>{posts.map((post) => <tr key={post._id}><td>{post.title}</td><td>{typeof post.author === 'object' ? post.author?.name : 'XBlog member'}</td><td>{post.likes?.length || 0}</td><td>{new Date(post.createdAt).toLocaleDateString('en-GB')}</td><td><div className="inline-actions"><Link to={`/posts/${post._id}`} className="button button-info-outline button-tiny">View</Link><form onSubmit={(event) => { event.preventDefault(); deletePost(post._id); }}><button className="button button-danger-outline button-tiny" type="submit">Delete</button></form></div></td></tr>)}</tbody></table></div> : !error && <p>No posts found.</p>}</section>
  </Page>;
}

export default function App() {
  return <><Header /><Routes>
    <Route path="/" element={<FeedPage />} />
    <Route path="/signup" element={<AuthPage mode="signup" />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
    <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
    <Route path="/posts/create" element={<Protected><PostFormPage /></Protected>} />
    <Route path="/posts/new" element={<Protected><PostFormPage /></Protected>} />
    <Route path="/posts/:id" element={<PostDetailPage />} />
    <Route path="/posts/:id/edit" element={<Protected><PostFormPage edit /></Protected>} />
    <Route path="/admin" element={<Protected admin><AdminPage /></Protected>} />
    <Route path="*" element={<Page><div className="empty-state"><h1>Page not found</h1><Link to="/" className="text-link">Back to home</Link></div></Page>} />
  </Routes><footer className="site-footer"><Link className="brand" to="/"><span className="brand-mark">x</span>blog</Link><p>Stories worth sharing.</p><span>© {new Date().getFullYear()} XBlog</span></footer></>;
}
