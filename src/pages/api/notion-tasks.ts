import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';

export const GET: APIRoute = async () => {
  const apiKey = import.meta.env.NOTION_API_KEY;
  const dbId = import.meta.env.NOTION_KANBAN_DB_ID;

  if (!apiKey || !dbId) {
    return new Response(JSON.stringify({ error: 'Notion not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const notion = new Client({ auth: apiKey });

  const response = await notion.dataSources.query({
    data_source_id: dbId,
    sorts: [{ property: 'Priority', direction: 'ascending' }],
  });

  const tasks = response.results.map((page: any) => ({
    id: page.id,
    name: page.properties.Name?.title?.[0]?.plain_text ?? '',
    project: page.properties.Project?.select?.name ?? '',
    priority: page.properties.Priority?.select?.name ?? '',
    status: page.properties.Status?.status?.name ?? page.properties.Status?.select?.name ?? 'Backlog',
    notes: page.properties.Notes?.rich_text?.[0]?.plain_text ?? '',
  }));

  const counts = {
    backlog: tasks.filter(t => t.status === 'Backlog').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    blocked: tasks.filter(t => t.status === 'Blocked').length,
    done: tasks.filter(t => t.status === 'Done').length,
  };

  return new Response(JSON.stringify({ tasks, counts }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
