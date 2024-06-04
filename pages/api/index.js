import { Project } from "ts-morph";
import JSON5 from "json5";
export default async function handler(req, res) {
    if (req.method === 'POST') {
      // Process a POST request
      const text = req.body
      console.log(text);
      return res.json(getEntityJson(text));
      //res.status(200).json({ name: 'POST' })
    } else {
      // Handle any other HTTP method
      // console.log(req);
      //const u = new URL('http://127.0.0.1/' + req.url);
      let url = req.query.url;
      if(!url) return res.status(400).json({ error: "url is required" });
      //let url = "https://s3.65515107.xyz/temp/workspace.ts"
      let tsSource = await fetch(url).then(r => r.text());
      return res.json(getEntityJson(tsSource));
      //res.status(200).json({ name: 'John Doe' })
    }
  }
// https://s3.65515107.xyz/temp/workspace.ts
  function getEntityJson(tsSource) {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile("/tmp/entity.ts", tsSource);
    //project.addSourceFilesAtPaths(sourceFile);
    let ret = [];
    sourceFile.getClasses().forEach(classDeclaration => {
        //let cls = {};
        let dec = classDeclaration.getDecorators();
        let name = classDeclaration.getName();
        let ett = classDeclaration.getDecorators().find(decorator => {
            return decorator.getName() == "Entity";
        })?.getArguments()[0];
        let entity = ett?.getText().replace(/['"]/g, "");
        let properties = [];
        classDeclaration.getProperties().forEach(property => {
            let name = property.getName();
            let type = property.getType().getText();
            let Column = property.getDecorators().find(decorator => {
                return decorator.getName() == "Column";
            });
            let column;
            if (Column) {
                try {
                    column = JSON5.parse(Column.getArguments()[0].getText());
                }
                catch (error) {
                    column = Column.getArguments()[0].getText();
                    console.info(column, error);
                }
            }
            let prop = { name, type, column };
            properties.push(prop);
        });
        ret.push({ name, entity, properties });
        //console.info(cls);
    });
    return ret;
}