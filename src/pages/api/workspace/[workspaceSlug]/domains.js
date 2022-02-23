import { getSession } from 'next-auth/react';

import prisma from '@/prisma/index';

const handler = async (req, res) => {
  const { method } = req;

  if (method === 'GET') {
    const session = await getSession({ req });

    if (session) {
      const slug = req.query.workspaceSlug;
      const workspace = await prisma.workspace.findFirst({
        select: {
          domains: {
            select: {
              name: true,
            },
          },
        },
        where: {
          OR: [
            {
              id: session.user.userId,
            },
            {
              members: {
                some: {
                  email: session.user.email,
                  deletedAt: null,
                },
              },
            },
          ],
          AND: {
            deletedAt: null,
            slug,
            domains: {
              every: {
                deletedAt: null,
              },
            },
          },
        },
      });
      res.status(200).json({ data: { domains: workspace?.domains || [] } });
    } else {
      res.status(401).json({ error: 'Unauthorized access' });
    }
  } else {
    res.status(405).json({ error: `${method} method unsupported` });
  }
};

export default handler;
