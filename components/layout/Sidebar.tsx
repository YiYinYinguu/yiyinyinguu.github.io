"use client";

import Image from "next/image";
import { siteConfig } from "@/config/site";

export default function Sidebar() {
  const { profile, social } = siteConfig;

  return (
    <aside className="space-y-6">
      {/* Profile Picture */}
      <div className="mx-auto">
        <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden border-4 border-white shadow-lg">
          <Image
            src={profile.profileImage}
            alt={profile.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Name and Title */}
      {/* <div>
        <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
        <p className="text-base text-gray-600 mt-1">{profile.title}</p>
      </div> */}

      {/* Contact Info */}
      <div className="space-y-3 text-base">
        <a
          href={`mailto:${profile.email}`}
          className="block text-primary hover:underline"
          style={{ cursor: 'pointer' }}
        >
          📧 {profile.email}
        </a>

        <hr className="border-gray-200" />

        <p className="text-gray-600">
          {profile.department}
        </p>
        <p className="text-gray-600">
          {profile.university}
        </p>

        <hr className="border-gray-300" />
      </div>

      {/* Research Interests */}
      {profile.researchInterests && profile.researchInterests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Research Interests
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.researchInterests.map((interest, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-primary hover:text-white transition-colors"
                style={{ cursor: 'pointer' }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      <nav className="space-y-2">
        <a
          href={social.googleScholar}
          className="flex items-center gap-3 text-gray-700 hover:text-primary transition-colors text-base"
          style={{ cursor: 'pointer' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
            <path d="M343.759 106.662V79.43L363.524 64h-213.89L20.476 176.274h85.656a82.339 82.339 0 0 0-.219 6.225c0 20.845 7.22 38.087 21.672 51.861c14.453 13.797 32.252 20.648 53.327 20.648c4.923 0 9.75-.368 14.438-1.024c-2.907 6.5-4.374 12.523-4.374 18.142c0 9.875 4.499 20.43 13.467 31.642c-39.234 2.67-68.061 9.732-86.437 21.163c-10.531 6.5-19 14.704-25.39 24.531c-6.391 9.9-9.578 20.515-9.578 31.962c0 9.648 2.062 18.336 6.219 26.062c4.156 7.726 9.578 14.07 16.312 18.984c6.718 4.968 14.469 9.101 23.219 12.469c8.734 3.344 17.406 5.718 26.061 7.062A167.052 167.052 0 0 0 180.555 448c13.469 0 26.953-1.734 40.547-5.187c13.562-3.485 26.28-8.642 38.171-15.493c11.86-6.805 21.515-16.086 28.922-27.718c7.39-11.68 11.094-24.805 11.094-39.336c0-11.016-2.25-21.039-6.75-30.14c-4.468-9.073-9.938-16.542-16.452-22.345c-6.501-5.813-13-11.155-19.516-15.968c-6.5-4.845-12-9.75-16.468-14.813c-4.485-5.046-6.735-10.054-6.735-14.984c0-4.921 1.734-9.672 5.216-14.265c3.455-4.61 7.674-9.048 12.61-13.306c4.937-4.25 9.875-8.968 14.796-14.133c4.922-5.147 9.141-11.827 12.61-20.008c3.485-8.18 5.203-17.445 5.203-27.757c0-13.453-2.547-24.46-7.547-33.314c-.594-1.022-1.218-1.803-1.875-3.022l56.907-46.672v17.119c-7.393.93-6.624 5.345-6.624 10.635V245.96c0 5.958 4.875 10.834 10.834 10.834h3.989c5.958 0 10.833-4.875 10.833-10.834V117.293c0-5.277.778-9.688-6.561-10.63zm-107.36 222.48c1.14.75 3.704 2.78 7.718 6.038c4.05 3.243 6.797 5.695 8.266 7.414a443.553 443.553 0 0 1 6.376 7.547c2.813 3.375 4.718 6.304 5.718 8.734c1 2.477 2.016 5.461 3.047 8.946a38.27 38.27 0 0 1 1.485 10.562c0 17.048-6.564 29.68-19.656 37.859c-13.125 8.18-28.767 12.274-46.938 12.274c-9.187 0-18.203-1.093-27.063-3.196c-8.843-2.116-17.311-5.336-25.39-9.601c-8.078-4.258-14.577-10.204-19.5-17.797c-4.938-7.64-7.407-16.415-7.407-26.25c0-10.32 2.797-19.29 8.422-26.906c5.594-7.625 12.938-13.391 22.032-17.315c9.063-3.946 18.25-6.742 27.562-8.398a157.865 157.865 0 0 1 28.438-2.555c4.47 0 7.936.25 10.405.696c.455.219 3.032 2.07 7.735 5.563c4.704 3.462 7.625 5.595 8.75 6.384zm-3.359-100.579c-7.406 8.86-17.734 13.288-30.953 13.288c-11.86 0-22.298-4.764-31.266-14.312c-9-9.523-15.422-20.328-19.344-32.43c-3.937-12.109-5.906-23.984-5.906-35.648c0-13.694 3.596-25.352 10.781-34.976c7.187-9.65 17.5-14.485 30.938-14.485c11.875 0 22.374 5.038 31.437 15.157c9.094 10.085 15.61 21.413 19.517 33.968c3.922 12.54 5.873 24.53 5.873 35.984c0 13.446-3.702 24.61-11.076 33.454z"></path>
          </svg>
          <span>Google Scholar</span>
        </a>

        <a
          href={social.twitter}
          className="flex items-center gap-3 text-gray-700 hover:text-primary transition-colors text-base"
          style={{ cursor: 'pointer' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
          </svg>
          <span>Twitter</span>
        </a>

        <a
          href={social.linkedin}
          className="flex items-center gap-3 text-gray-700 hover:text-primary transition-colors text-base"
          style={{ cursor: 'pointer' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          <span>LinkedIn</span>
        </a>

        {social.github && (
          <a
            href={social.github}
            className="flex items-center gap-3 text-gray-700 hover:text-primary transition-colors text-base"
          style={{ cursor: 'pointer' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </a>
        )}
      </nav>
    </aside>
  );
}
