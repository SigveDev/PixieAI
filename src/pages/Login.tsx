const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${
  import.meta.env.VITE_SPOTIFY_CLIENT_ID
}&response_type=code&redirect_uri=https://pixie.sigve.dev&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-read-playback-state%20user-modify-playback-state%20playlist-read-private`;

const Login = () => {
  return (
    <div className="relative flex flex-col items-center justify-center w-dvw h-dvh">
      <div className="absolute h-full w-full bg-[radial-gradient(#161616_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      <a
        href={AUTH_URL}
        className="border-2 border-[#1ed760] bg-black rounded-full px-4 py-2 text-white z-10"
      >
        Login with Spotify
      </a>
    </div>
  );
};

export default Login;
