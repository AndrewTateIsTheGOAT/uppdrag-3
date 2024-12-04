import http from 'http';
import { getRequestBody, cleanupHTMLOutput } from '../utilities.js';
import { dbo } from '../index.js';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';

export async function handleProfilesRoute(pathSegments, url, request, response) {
    let nextSegment = pathSegments.shift();
    if (!nextSegment) {
        if (request.method === 'POST') {
            let body = await getRequestBody(request);

            let params = new URLSearchParams(body);

            if (!params.get('profileName') || !params.get('profileTitle')){

                response.writeHead(400, { 'Content-Type': 'text/plain' });
                response.write('400 Bad Request');
                response.end();
                return;
            }

            let result = await dbo.collection('Inlägg').insertOne({
                'name': params.get('profileName'),
                'title': params.get('profileTitle'),
                'breadText': params.get('profileBreadtext')
            }); 

            response.writeHead(303, { 'Location': '/posts/' + result.insertedId });
            response.write('303 see other');
            response.end();
            return;
        }

        if (request.method === 'GET') {
            let filter = {};

            if(url.searchParams.has('name')){
                filter.name = url.searchParams.get('name');
            }
            if(url.searchParams.has('title')){
                filter.title = url.searchParams.get('title');
            }
            if(url.searchParams.has('breadText')){
                filter.breadText = url.searchParams.get('breadText');
            }
            if(url.searchParams.has('id')){
                filter.id = url.searchParams.get('id');
            }
            let documents = await dbo.collection('uppdrag_3').find(filter).toArray();

            let profilesString = '';


            for (let i = 0; i < documents.length; i++) {
                profilesString += '<li><a href="/posts/' + cleanupHTMLOutput(documents[i]._id.toString()) + '">' + cleanupHTMLOutput(documents[i].name) + ' (' + cleanupHTMLOutput(documents[i].title) + ')</a></li>';
            }
            let template = (await fs.readFile('templates/profilesList.volvo')).toString();

            template = template.replaceAll('%{profilesList}%', profilesString);

            response.writeHead(200, { 'content-Type': 'text/html;charset=UTF-8' });
            response.write(template);
            response.end();
            return;
        }

        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write('405 Method Not Allowed');
        response.end();
        return;
    }

    let profileDocument;
    try {
        profileDocument = await dbo.collection('Inlägg').findOne({
            "_id": new ObjectId(nextSegment)
        });
    } catch (e) {
        response.writeHead(404, { 'content-Type': 'Text/Plain' });
        response.write('404 Not found');
        response.end();
        return;
    }
        if (request.method !== 'GET') {
            response.writeHead(405, { 'Content-Type': 'text/plain' });
            response.write('405 Method Not Allowed');
            response.end();
            return;
        }

        if (!profileDocument) {
            response.writeHead(404, { 'content-Type': 'Text/Plain' });
            response.write('404 Not found');
            response.end();
            return;
        }

        let template = (await fs.readFile('templates/profile.volvo')).toString();
        template = template.replaceAll('%{profileName}%', cleanupHTMLOutput(profileDocument.name));
        template = template.replaceAll('%{profileEmail}%', cleanupHTMLOutput(profileDocument.title));
        template = template.replaceAll('%{profileAge}%', cleanupHTMLOutput(profileDocument.breadText));

        response.writeHead(200, { 'content-Type': 'text/html;charset=UTF-8' });
        response.write(template);
        response.end();
        return;
    }