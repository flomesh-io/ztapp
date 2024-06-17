const apps = {
  path: "/app",
  name: "Apps",
  children: [
		{
				path: '/app/term',
				name: 'term',
				component: () => import('@/views/apps/core/TermContent.vue')
		},
  ],
};

export default apps;
